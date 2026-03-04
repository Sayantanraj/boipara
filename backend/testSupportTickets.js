const mongoose = require('mongoose');
const SupportTicket = require('./models/SupportTicket');
require('dotenv').config();

async function testSupportTickets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boipara');
    console.log('✅ Connected to MongoDB\n');

    // Create a test support ticket
    const testTicket = new SupportTicket({
      name: 'Test User',
      email: 'test@example.com',
      userRole: 'customer',
      subject: 'Test Support Ticket',
      message: 'This is a test support ticket to verify the system is working correctly.',
      status: 'open',
      priority: 'medium'
    });

    await testTicket.save();
    console.log('✅ Test ticket created successfully!');
    console.log('   Ticket ID:', testTicket._id);
    console.log('   Subject:', testTicket.subject);
    console.log('   Status:', testTicket.status);
    console.log('   Priority:', testTicket.priority);
    console.log('');

    // Fetch all tickets
    const allTickets = await SupportTicket.find({});
    console.log(`📊 Total tickets in database: ${allTickets.length}`);
    console.log('');

    // Show ticket details
    if (allTickets.length > 0) {
      console.log('📋 All Support Tickets:');
      allTickets.forEach((ticket, index) => {
        console.log(`${index + 1}. ${ticket.subject}`);
        console.log(`   From: ${ticket.name} (${ticket.email})`);
        console.log(`   Role: ${ticket.userRole}`);
        console.log(`   Status: ${ticket.status} | Priority: ${ticket.priority}`);
        console.log(`   Created: ${ticket.createdAt.toLocaleString()}`);
        console.log('');
      });
    }

    // Test status update
    testTicket.status = 'in-progress';
    testTicket.priority = 'high';
    testTicket.adminNotes = 'Working on this issue';
    await testTicket.save();
    console.log('✅ Ticket status updated successfully!');
    console.log('   New Status:', testTicket.status);
    console.log('   New Priority:', testTicket.priority);
    console.log('   Admin Notes:', testTicket.adminNotes);
    console.log('');

    console.log('🎉 Support Ticket System Test Complete!');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Start the backend server: cd backend && npm run dev');
    console.log('2. Start the frontend: npm run dev');
    console.log('3. Go to Help & Support → Support Ticket tab');
    console.log('4. Submit a test ticket');
    console.log('5. Login as admin and check the Tickets tab');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

testSupportTickets();
