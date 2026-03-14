const mongoose = require('mongoose');
const SupportTicket = require('./models/SupportTicket');

// Connect to MongoDB
mongoose.connect('mongodb+srv://Boipara:sayantan@cluster0.344nydb.mongodb.net/boipara?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testSupportTickets() {
  try {
    console.log('🎫 Testing Support Tickets...');
    
    // Create a test ticket
    const testTicket = new SupportTicket({
      userId: new mongoose.Types.ObjectId(),
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      subject: 'Test Support Ticket',
      description: 'This is a test support ticket to verify the system is working.',
      priority: 'Medium',
      messages: [{
        sender: 'customer',
        senderName: 'Test User',
        message: 'This is a test support ticket to verify the system is working.',
        timestamp: new Date()
      }]
    });
    
    await testTicket.save();
    console.log('✅ Test ticket created:', testTicket.ticketId);
    
    // Retrieve all tickets
    const tickets = await SupportTicket.find({}).sort({ createdAt: -1 });
    console.log('📋 Found tickets:', tickets.length);
    
    tickets.forEach((ticket, index) => {
      console.log(`\n🎫 Ticket ${index + 1}:`);
      console.log('  ID:', ticket._id);
      console.log('  Ticket ID:', ticket.ticketId);
      console.log('  Customer Name:', ticket.customerName);
      console.log('  Customer Email:', ticket.customerEmail);
      console.log('  Subject:', ticket.subject);
      console.log('  Description:', ticket.description);
      console.log('  Status:', ticket.status);
      console.log('  Priority:', ticket.priority);
      console.log('  Created:', ticket.createdAt);
    });
    
    // Clean up test ticket
    await SupportTicket.deleteOne({ _id: testTicket._id });
    console.log('🗑️ Test ticket cleaned up');
    
  } catch (error) {
    console.error('❌ Error testing support tickets:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testSupportTickets();