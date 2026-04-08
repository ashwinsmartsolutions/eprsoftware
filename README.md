# EPR System - Extended Producer Responsibility for Soft Drink Company

A comprehensive MERN stack application for managing distributor networks, stock allocation, sales tracking, and empty bottle collection for a soft drink company.

## 🎯 Features

### Producer (Admin) Features
- **Dashboard**: Overview of total distributors, stock issued, bottles sold, and empty bottles returned
- **Distributor Management**: Create, update, delete distributors
- **Stock Allocation**: Assign stock (6 flavors) to distributors
- **Analytics**: Visual charts and detailed performance metrics

### Distributor Features
- **Dashboard**: Current stock levels, total sold, empty bottles collected
- **Shop Management**: Add/edit shops with location and contact details
- **Stock Distribution**: Allocate stock from distributor inventory to individual shops
- **Transaction Updates**: Record sales and empty bottle returns per shop

### 🗄️ Database Schema
- **Users**: Authentication with role-based access (producer/distributor)
- **Distributors**: Contact info, stock levels, sales metrics
- **Shops**: Shop details managed by distributors
- **Transactions**: Sales and empty bottle return records
- **Stock**: Real-time inventory tracking per flavor

## 🚀 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React 18** with React Router
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization
- **Axios** for API calls

## 📁 Project Structure

```
epr/
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── package.json
│   ├── server.js
│   └── .env
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd epr
```

### 2. Backend Setup

```bash
cd server
npm install
```

### 3. Environment Variables
Create a `.env` file in the `server` directory.

**For MongoDB Atlas (Cloud):**
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/epr_db?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

**For Local MongoDB:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/epr-system
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

> **Note:** To get your Atlas connection string, go to your MongoDB Atlas Dashboard → Database → Connect → Drivers → Node.js

### 5. Start Backend Server
```bash
npm run dev
```

The backend will start on `http://localhost:5000`

### 6. Frontend Setup

Open a new terminal and navigate to the client directory:

```bash
cd client
npm install
```

### 7. Start Frontend Development Server
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## 🔐 Default Login Credentials

### Producer (Admin)
- **Email**: admin@epr.com
- **Password**: admin123

### Distributor (Demo)
- **Email**: dist@epr.com  
- **Password**: dist123

*Note: These are demo credentials. In production, create users through the producer dashboard.*

## 📱 Usage Guide

### For Producers
1. Login with producer credentials
2. Add distributors from the Distributors section
3. Allocate stock to distributors from Stock Allocation
4. Monitor performance through Analytics dashboard

### For Distributors
1. Login with distributor credentials
2. Add shops from Shop Management
3. Distribute stock to shops from Stock Distribution
4. Record daily sales and empty bottle returns from Update Sales/Returns

## 🎨 UI Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean card-based layout with Tailwind CSS
- **Interactive Charts**: Real-time data visualization with Recharts
- **Form Validation**: Client-side validation with user-friendly error messages
- **Loading States**: Smooth loading indicators for better UX

## 🔧 Development Scripts

### Backend
```bash
npm start      # Start production server
npm run dev    # Start development server with nodemon
```

### Frontend
```bash
npm start      # Start development server
npm build      # Build for production
npm test       # Run tests
```

## 🌟 Key Features Implemented

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Protected routes
- Auto-logout on token expiration

### Real-time Updates
- Stock levels update instantly
- Sales and empty bottle tracking
- Aggregated statistics for producer dashboard

### Data Management
- CRUD operations for distributors and shops
- Transaction logging
- Inventory management
- Performance analytics

### User Experience
- Intuitive navigation
- Responsive modals and forms
- Error handling and validation
- Loading states and feedback

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and deploy to your preferred platform (Heroku, AWS, etc.)
3. Ensure MongoDB is accessible from your deployment environment

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy the build folder to your hosting service
3. Configure API endpoint if needed

## 📞 Support

For any issues or questions:
1. Check the console for error messages
2. Verify MongoDB connection
3. Ensure all environment variables are set correctly
4. Check network connectivity between frontend and backend

## 🔄 Future Enhancements
- Real-time notifications with Socket.io
- Advanced reporting and export features
- Mobile app development
- SMS/email notifications
- Advanced analytics and forecasting
- Multi-language support
