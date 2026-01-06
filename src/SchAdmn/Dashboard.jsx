import React from 'react';

const Dashboard = () => {
  return (
    <div

    style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '2rem',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      minHeight: 'calc(100vh - 4rem)' // Adjust based on your padding
    }}
    >
      <h1>Admin Dashboard</h1>
      <p>Welcome to the admin panel.</p>
    </div>
  );
};

export default Dashboard;
