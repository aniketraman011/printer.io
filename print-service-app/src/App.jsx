import React, { useState, useEffect, useRef } from 'react';
import { Form, Upload, message, Input, Button, Radio, Table, Tag, Modal, notification, Spin, Alert, Checkbox } from 'antd';
import { UploadOutlined, WhatsAppOutlined, EyeOutlined, CheckCircleOutlined, SyncOutlined, ClockCircleOutlined, UserOutlined, PhoneOutlined, MailOutlined, CopyOutlined, DollarCircleOutlined, LockOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { animateScroll as scroll } from 'react-scroll';

const { TextArea } = Input;

// Base URL for your backend API
const API_URL = 'https://printer-io.onrender.com/api';

const PaymentQRModal = ({ visible, onClose }) => {
  return (
    <Modal
      title="Complete Your Payment"
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      className="rounded-lg shadow-xl"
    >
      <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Scan to Pay</h3>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
          Please make your payment using the QR code below.
          After payment, send the screenshot to our WhatsApp to confirm.
        </p>
<div className="flex justify-center">
  <div className="w-100 max-w-xs border border-gray-300 rounded-lg overflow-hidden">
    <img
      src="scan.jpg"
      alt="Payment QR Code"
      height={300}
      className="w-full h-auto object-contain"
    />
  </div>
</div>


        <div className="mt-4 text-center">
          <p className="font-semibold text-gray-800 dark:text-gray-100">Payment Instructions:</p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
            <li>Scan the QR code with your preferred payment app.</li>
            <li>PRICE:- rs 5(single or double side ).</li>
            <li>Complete the payment.</li>
            <li>Take a screenshot of the successful transaction.</li>
            <li>Send the screenshot to our WhatsApp number: <a href="https://wa.me/919412010234" target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 font-bold">9412010234</a></li>
          </ul>
        </div>
        <Button onClick={onClose} className="mt-6 w-full md:w-1/2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200">
          Close
        </Button>
      </div>
    </Modal>
  );
};

const whatsappNotification = (message) => {
  notification.open({
    message: 'WhatsApp Notification',
    description: message,
    icon: <WhatsAppOutlined style={{ color: '#25D366' }} />,
    placement: 'bottomRight',
    duration: 5,
  });
};

const AuthContext = React.createContext(null);

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const checkAuth = async () => {
    setIsAuthLoading(true);
    if (token) {
      try {
        const response = await fetch(`${API_URL}/auth/user`, {
          method: 'GET',
          headers: { 'x-auth-token': token },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAdmin(userData.role === 'admin');
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        setToken(null);
      }
    }
    setIsAuthLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, [token]);

  // Function to fetch orders from the backend
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? `${API_URL}/orders` : `${API_URL}/orders/customer`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to load orders from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, isAdmin]);

  const onLogin = async (values) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const errorData = await response.json();
        // Check for specific status codes for login failure
        if (response.status === 400 || response.status === 401) {
            message.error('Incorrect email or password. Please try again.');
        } else {
            message.error(errorData.message || 'Login failed.');
        }
        return (
          alert('Login failed. Please check your credentials.')
        ) ;
      }
      const { token, role } = await response.json();
      localStorage.setItem('token', token);
      setToken(token);
      message.success(`Logged in as ${role}`);
    } catch (error) {
      message.error('An unexpected error occurred. Please try again.');
    }
  };

  const onRegister = async (values) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, role: 'customer' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('User already exists')) {
            message.error('This email is already registered. Please log in or use a different email.');
        } else {
            message.error(errorData.message || 'Registration failed.');
        }
        return (
          alert('Registration failed. .')
        );
      }
      const { token } = await response.json();
      localStorage.setItem('token', token);
      setToken(token);
      message.success('Registration successful! You are now logged in.');
    } catch (error) {
      message.error('An unexpected error occurred. Please try again.');
    }
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    setOrders([]);
    message.info('Logged out successfully.');
  };

  const onOrderSubmit = async (values) => {
    const formData = new FormData();
    formData.append('customerName', values.customerName);
    formData.append('phoneNumber', values.phoneNumber);
    formData.append('year', values.year);
    formData.append('semester', values.semester);
    formData.append('printSide', values.printSide);
    formData.append('pages', values.pages);
    formData.append('copies', values.copies);
    formData.append('message', values.message || '');
  
    values.upload?.fileList?.forEach(file => {
      formData.append('files', file.originFileObj);
    });

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to submit order');
      }
      const createdOrder = await response.json();
      setOrders([createdOrder, ...orders]);
      setCurrentOrder(createdOrder);
      setIsQRModalVisible(true);
      message.success('Order submitted successfully!');
    } catch (error) {
      console.error('Error submitting order:', error);
      message.error('Failed to submit order. Please try again.');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      const updatedOrder = await response.json();
      const updatedOrders = orders.map(order =>
        order._id === updatedOrder._id ? updatedOrder : order
      );
      setOrders(updatedOrders);
      message.success(`Order #${updatedOrder._id} status updated to ${newStatus}`);

      if (newStatus === 'Ready for Pickup') {
        whatsappNotification(`Hi ${updatedOrder.customerName}, your printing job (Order ID: ${updatedOrder._id}) is ready for pickup!`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update order status. Please try again.');
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'volcano';
      case 'Payment Confirmed': return 'orange';
      case 'Printing': return 'geekblue';
      case 'Ready for Pickup': return 'green';
      case 'Completed': return 'cyan';
      default: return 'gray';
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const paymentConfirmedOrders = orders.filter(o => o.status === 'Payment Confirmed').length;
  const printingOrders = orders.filter(o => o.status === 'Printing').length;
  const readyForPickupOrders = orders.filter(o => o.status === 'Ready for Pickup').length;
  const completedOrders = orders.filter(o => o.status === 'Completed').length;

  const orderColumns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: 'id',
      render: text => <span className="font-mono text-xs">{text}</span>
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: text => <span className="text-sm">{text}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} key={status} className="font-bold">{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <div className="flex space-x-2">
          {record.status === 'Pending' && (
            <Button
              type="primary"
              icon={<DollarCircleOutlined />}
              onClick={() => updateOrderStatus(record._id, 'Payment Confirmed')}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Confirm Payment
            </Button>
          )}
          {record.status === 'Payment Confirmed' && (
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => updateOrderStatus(record._id, 'Printing')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Start Printing
            </Button>
          )}
          {record.status === 'Printing' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => updateOrderStatus(record._id, 'Ready for Pickup')}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Mark Ready
            </Button>
          )}
          {record.status === 'Ready for Pickup' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => updateOrderStatus(record._id, 'Completed')}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Complete Order
            </Button>
          )}
          <Button
            icon={<EyeOutlined />}
            onClick={() => { setCurrentOrder(record); setIsOrderModalVisible(true); }}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  const pieChartData = [
    { name: 'Pending', value: pendingOrders },
    { name: 'Payment Confirmed', value: paymentConfirmedOrders },
    { name: 'Printing', value: printingOrders },
    { name: 'Ready for Pickup', value: readyForPickupOrders },
    { name: 'Completed', value: completedOrders },
  ];
  const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#00CED1'];

  const AdminView = () => (
    <div className="p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 dark:text-gray-100 mb-8 animate-fade-in">Admin Dashboard</h1>
      {loading && <Spin size="large" className="block text-center mb-8" />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 animate-fade-in-up">
        <Card className="rounded-2xl shadow-lg border-none hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
          <Statistic
            title="Pending Orders"
            value={pendingOrders}
            valueStyle={{ color: '#cf1322' }}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
        <Card className="rounded-2xl shadow-lg border-none hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
          <Statistic
            title="Payments Confirmed"
            value={paymentConfirmedOrders}
            valueStyle={{ color: '#fa8c16' }}
            prefix={<DollarCircleOutlined />}
          />
        </Card>
        <Card className="rounded-2xl shadow-lg border-none hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
          <Statistic
            title="Printing Orders"
            value={printingOrders}
            valueStyle={{ color: '#108ee9' }}
            prefix={<SyncOutlined spin />}
          />
        </Card>
        <Card className="rounded-2xl shadow-lg border-none hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
          <Statistic
            title="Ready for Pickup"
            value={readyForPickupOrders}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
        <Card className="rounded-2xl shadow-lg border-none hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
          <Statistic
            title="Completed Orders"
            value={completedOrders}
            valueStyle={{ color: '#00CED1' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </div>
      
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Order Statistics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">All Orders</h2>
        <Table columns={orderColumns} dataSource={orders} rowKey="_id" className="rounded-2xl overflow-hidden shadow-inner" />
      </div>

      <Modal
        title={`Order Details - #${currentOrder?._id}`}
        open={isOrderModalVisible}
        onCancel={() => setIsOrderModalVisible(false)}
        footer={null}
        centered
        className="rounded-lg shadow-xl"
      >
        {currentOrder && (
          <div className="p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
            <p><strong>Customer:</strong> {currentOrder.customerName}</p>
            <p><strong>Phone:</strong> {currentOrder.phoneNumber}</p>
            <p><strong>Year:</strong> {currentOrder.year}</p>
            <p><strong>Semester:</strong> {currentOrder.semester}</p>
            <p><strong>Printing:</strong> {currentOrder.printSide}</p>
            <p><strong>Pages:</strong> {currentOrder.pages}</p>
            <p><strong>Copies:</strong> {currentOrder.copies}</p>
            <p><strong>Status:</strong> <Tag color={getStatusColor(currentOrder.status)} className="font-bold">{currentOrder.status.toUpperCase()}</Tag></p>
            {currentOrder.message && <p><strong>Message:</strong> {currentOrder.message}</p>}
            {currentOrder.filePaths && currentOrder.filePaths.length > 0 && (
              <div>
                <strong>Files:</strong>
                <ul className="list-disc list-inside">
                  {currentOrder.filePaths.map((filePath, index) => (
                    <li key={index}>
                      <a href={`${API_URL}/${filePath}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">
                        {filePath.split('/').pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );

  const CustomerView = () => (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 dark:text-gray-100 mb-8 animate-fade-in">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500">
          Online Print Service
        </span>
      </h1>
      
      {currentOrder && (
        <div className="animate-fade-in-down mb-8">
          <Alert
            message="Order Submitted!"
            description={`Your order #${currentOrder._id} has been submitted. The current status is: ${currentOrder.status}.`}
            type="info"
            showIcon
            action={
              currentOrder.status === 'Pending' && (
                <Button size="small" type="primary" onClick={() => setIsQRModalVisible(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
                  View QR Code
                </Button>
              )
            }
            closable
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in-left text-gray-800 dark:text-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Place a New Order</h2>
          <Form
            layout="vertical"
            onFinish={onOrderSubmit}
            initialValues={{ printSide: 'One-sided', pages: 1, copies: 1 }}
            className="space-y-4"
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="customerName"
                  label="Your Name"
                  rules={[{ required: true, message: 'Please enter your name!' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="e.g., Jane Doe" className="rounded-lg shadow-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="phoneNumber"
                  label="Phone Number"
                  rules={[{ required: true, message: 'Please enter your phone number!' }]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="e.g., 9876543210" className="rounded-lg shadow-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="year"
                  label="Academic Year"
                  rules={[{ required: true, message: 'Please select your year!' }]}
                >
                  <Radio.Group className="flex flex-col space-y-2">
                    <Radio value="1st Year" className="text-gray-800 dark:text-gray-100">1st Year</Radio>
                    <Radio value="2nd Year" className="text-gray-800 dark:text-gray-100">2nd Year</Radio>
                    <Radio value="3rd Year" className="text-gray-800 dark:text-gray-100">3rd Year</Radio>
                    <Radio value="4th Year" className="text-gray-800 dark:text-gray-100">4th Year</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            
            </Row>

            <Form.Item name="printSide" label="Print On">
              <Radio.Group>
                <Radio.Button value="One-sided" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600">One-sided</Radio.Button>
                <Radio.Button value="Two-sided" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600">Two-sided</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="pages"
                  label="Number of Pages"
                  rules={[{ required: true, message: 'Please enter page count!' }]}
                >
                  <Input type="number" min={1} className="rounded-lg shadow-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="copies"
                  label="Number of Copies"
                  rules={[{ required: true, message: 'Please enter copy count!' }]}
                >
                  <Input type="number" min={1} className="rounded-lg shadow-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="upload"
              label="Upload Files (Optional)"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) return e;
                return e?.fileList;
              }}
            >
              <Upload
                name="files"
                listType="text"
                multiple
                beforeUpload={() => false} // Prevent automatic upload
              >
                <Button icon={<UploadOutlined />} className="bg-gray-100 dark:bg-gray-700 border-dashed rounded-lg w-full py-6 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600">
                  Click to Upload
                </Button>
              </Upload>
            </Form.Item>

            <Form.Item name="message" label="Additional Instructions (Optional)">
              <TextArea rows={4} placeholder="e.g., Bind the first two pages and leave the rest loose." className="rounded-lg shadow-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Submit Order
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in-right text-gray-800 dark:text-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Recent Orders</h2>
          <div className="space-y-4">
            {loading && <Spin />}
            {!loading && orders.length === 0 ? (
              <Alert message="No orders yet." type="info" />
            ) : (
              orders.map(order => (
                <Card
                  key={order._id}
                  className="rounded-xl shadow-md border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700"
                  hoverable
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Order #{order._id}</h3>
                    <Tag color={getStatusColor(order.status)}>{order.status.toUpperCase()}</Tag>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Items:</span> {order.pages} pages, {order.copies} copies
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Printing:</span> {order.printSide}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const AuthForm = ({ onLogin, onRegister, isRegistering, setIsRegistering, isDarkMode, toggleDarkMode }) => {
    const title = isRegistering ? "Create an Account" : "Login to Your Account";
    const buttonText = isRegistering ? "Register" : "Login";
    const switchText = isRegistering ? "Already have an account?" : "Don't have an account?";
    const switchLinkText = isRegistering ? "Log in now" : "Register now";
  
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md p-8 rounded-2xl shadow-2xl animate-fade-in bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">Print.io</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{title}</p>
          </div>
          <Form
            layout="vertical"
            onFinish={isRegistering ? onRegister : onLogin}
          >
            <Form.Item
  name="email"
  label="Email"
  rules={[
    { required: true, message: 'Please enter your email!' },
    { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: 'Invalid email address' }
  ]}
>
              <Input prefix={<UserOutlined />} placeholder="Email" className="rounded-lg shadow-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" className="rounded-lg shadow-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {buttonText}
              </Button>
            </Form.Item>
          </Form>
          <div className="text-center mt-4">
            <p className="text-gray-600 dark:text-gray-300">
              {switchText} <a onClick={() => setIsRegistering(!isRegistering)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 cursor-pointer">{switchLinkText}</a>
            </p>
          </div>
        </Card>
      </div>
    );
  };
  
  const MainAppLayout = () => (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans antialiased text-gray-800 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-lg p-4 sticky top-0 z-50">
        <nav className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">Print.io</span>
            {user && user.role === 'admin' && (
              <Button
                type="primary"
                onClick={() => setIsAdmin(!isAdmin)}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-full shadow-md"
              >
                Switch to {isAdmin ? 'Customer' : 'Admin'} View
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleDarkMode}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
            />
            <a href="https://wa.me/919412010234" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors duration-200">
              <WhatsAppOutlined style={{ fontSize: '24px' }} />
              <span className="ml-2 font-semibold hidden md:inline">Contact on WhatsApp</span>
            </a>
            <Button onClick={onLogout} danger className="font-semibold rounded-full shadow-md">
              Logout
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isAdmin ? <AdminView /> : <CustomerView />}
      </main>

      <PaymentQRModal
        visible={isQRModalVisible}
        onClose={() => setIsQRModalVisible(false)}
      />
    </div>
  );

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  return user ? (
    <MainAppLayout />
  ) : (
    <AuthForm
      onLogin={onLogin}
      onRegister={onRegister}
      isRegistering={isRegistering}
      setIsRegistering={setIsRegistering}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
    />
  );
};

export default App;