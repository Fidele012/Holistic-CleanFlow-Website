const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Validation middleware
const validatePayment = [
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('currency').isIn(['usd', 'eur', 'gbp']).withMessage('Valid currency is required')
];

// Get payment history
router.get('/history', auth, async (req, res) => {
    try {
        const payments = await stripe.paymentIntents.list({
            customer: req.user.stripeCustomerId,
            limit: 10
        });

        res.json(payments.data);
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create payment intent
router.post('/create-payment-intent', [auth, validatePayment], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { amount, currency } = req.body;

        // Create or get Stripe customer
        let stripeCustomerId = req.user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: req.user.email,
                metadata: {
                    userId: req.user._id.toString()
                }
            });
            stripeCustomerId = customer.id;
            req.user.stripeCustomerId = customer.id;
            await req.user.save();
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            customer: stripeCustomerId,
            metadata: {
                userId: req.user._id.toString()
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Handle webhook events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            // Update user's payment status
            await User.findOneAndUpdate(
                { stripeCustomerId: paymentIntent.customer },
                { $push: { paymentHistory: paymentIntent.id } }
            );
            break;
        case 'payment_intent.payment_failed':
            // Handle failed payment
            console.log('Payment failed:', event.data.object);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Get payment methods
router.get('/payment-methods', auth, async (req, res) => {
    try {
        if (!req.user.stripeCustomerId) {
            return res.json([]);
        }

        const paymentMethods = await stripe.paymentMethods.list({
            customer: req.user.stripeCustomerId,
            type: 'card'
        });

        res.json(paymentMethods.data);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add payment method
router.post('/payment-methods', auth, async (req, res) => {
    try {
        const { paymentMethodId } = req.body;

        if (!req.user.stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: req.user.email,
                metadata: {
                    userId: req.user._id.toString()
                }
            });
            req.user.stripeCustomerId = customer.id;
            await req.user.save();
        }

        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: req.user.stripeCustomerId
        });

        // Set as default payment method
        await stripe.customers.update(req.user.stripeCustomerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        });

        res.json({ message: 'Payment method added successfully' });
    } catch (error) {
        console.error('Error adding payment method:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove payment method
router.delete('/payment-methods/:id', auth, async (req, res) => {
    try {
        await stripe.paymentMethods.detach(req.params.id);
        res.json({ message: 'Payment method removed successfully' });
    } catch (error) {
        console.error('Error removing payment method:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 