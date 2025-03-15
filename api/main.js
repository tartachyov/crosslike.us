// Example Express.js endpoint
app.post('/create-subscription', async (req, res) => {
    const { paymentMethodId, userId } = req.body;
    
    try {
      const customer = await stripe.customers.create({
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
  
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: 'your_price_id_here' }],
        expand: ['latest_invoice.payment_intent']
      });
  
      res.json({ 
        customerId: customer.id,
        status: subscription.status
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });