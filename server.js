


require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/admin');

const app = express();

// Middleware
app.use(cors({
  origin: `${process.env.VITE_FRONT_URL}`, // Replace with the actual origin of your client app
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
  // optionsSuccessStatus: 200, // Some legacy browsers (IE11) choke on a 204 response
  }));



app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Models
const User = require('./models/User');
const Order = require('./models/Order');
const LandingPage = require('./models/LandingPage');
app.get('/test',async(req,res)=>{
  res.send('hello')
})
// In your login route (/api/auth/login)
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
      
      // Make sure to include ALL necessary fields in the token
      const token = jwt.sign(
        { 
          id: user._id,
          role: user.role,  // This is the critical line you're missing
          name: user.name,
          username: user.username
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );
      
      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          role: user.role
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Users routes
app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

app.post('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      username,
      password: hashedPassword,
      role
    });
    
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, username, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, username, role },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Orders routes
app.get('/api/orders', authMiddleware, async (req, res) => {
    try {
      let query = {};
      if (req.user.role !== 'admin') {
        query.user_id = req.user.id;
      }
      
      if (req.query.user_id) {
        query.user_id = req.query.user_id;
      }
      
      const orders = await Order.find(query);
      res.json(orders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { clt_fullname, clt_tel, clt_address, city, status } = req.body;
    const order = new Order({
      clt_fullname,
      clt_tel,
      clt_address,
      city,
      status,
      user_id: req.user.id
    });
    
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { clt_fullname, clt_tel, clt_address, city, status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { clt_fullname, clt_tel, clt_address, city, status },
      { new: true }
    );
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user.id
    });
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Landing pages routes
app.get('/api/landingpages', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const landingPages = await LandingPage.find();
      res.json(landingPages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  app.get('/api/landingpageslug/:slug', async (req, res) => {
    try {
      const landingPage = await LandingPage.findOne({ slug: req.params.slug });
      
      if (!landingPage) {
        return res.status(404).json({ message: 'Landing page not found' });
      }
      
      res.json(landingPage);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

app.post('/api/landingpages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, slug, content } = req.body;
    const landingPage = new LandingPage({
      name,
      slug,
      content
    });
    
    await landingPage.save();
    res.status(201).json(landingPage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/landingpages/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, slug, content } = req.body;
    const landingPage = await LandingPage.findByIdAndUpdate(
      req.params.id,
      { name, slug, content },
      { new: true }
    );
    
    res.json(landingPage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/landingpages/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await LandingPage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Landing page deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));