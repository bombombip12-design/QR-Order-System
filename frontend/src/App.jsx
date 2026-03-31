import { Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { TableProvider } from './context/TableContext'

// Customer (scan QR → /table/:tableId)
import CustomerLayout from './pages/customer/CustomerLayout'
import MenuPage from './pages/customer/MenuPage'
import CartPage from './pages/customer/CartPage'
import OrderStatusPage from './pages/customer/OrderStatusPage'
import PaymentPage from './pages/customer/PaymentPage'

// Staff
import StaffLayout from './pages/staff/StaffLayout'
import StaffTables from './pages/staff/StaffTables'
import StaffTableOrders from './pages/staff/StaffTableOrders'
import StaffNewOrders from './pages/staff/StaffNewOrders'
import StaffPendingPayments from './pages/staff/StaffPendingPayments'
import StaffPaymentHistory from './pages/staff/StaffPaymentHistory'

// Kitchen
import KitchenLayout from './pages/kitchen/KitchenLayout'
import KitchenOrders from './pages/kitchen/KitchenOrders'

/**
 * Khu vực Admin (quản lý nhà hàng):
 * - URL: /admin, /admin/menu, … — giao diện React; dữ liệu lấy qua fetch tới /api/admin/* (xem api/client.ts → adminApi).
 * - Backend Node (Express) phục vụ REST tại tiền tố /api/admin — không chạy trong trình duyệt, chỉ máy chủ.
 */
// Admin
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminMenu from './pages/admin/AdminMenu'
import AdminCategories from './pages/admin/AdminCategories'
import AdminTables from './pages/admin/AdminTables'
import AdminStaff from './pages/admin/AdminStaff'
import AdminStats from './pages/admin/AdminStats'
import AdminOrders from './pages/admin/AdminOrders'
import AdminPaymentMethods from './pages/admin/AdminPaymentMethods'
import AdminRatings from './pages/admin/AdminRatings'

// Landing: khi scan QR sẽ redirect tới /table/:tableId (tableId từ QR)
import ScanLanding from './pages/ScanLanding'
import LoginPage from './pages/LoginPage'
import OrderByCodeRedirect from './pages/OrderByCodeRedirect'

function App() {
  return (
    <TableProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/scan" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/scan" element={<ScanLanding />} />
          <Route path="/order/:code" element={<OrderByCodeRedirect />} />
          <Route path="/table/:tableId" element={<CustomerLayout />}>
            <Route index element={<MenuPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="orders" element={<OrderStatusPage />} />
            <Route path="payment" element={<PaymentPage />} />
          </Route>

          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<StaffTables />} />
            <Route path="table/:tableId" element={<StaffTableOrders />} />
            <Route path="new-orders" element={<StaffNewOrders />} />
            <Route path="pending-payments" element={<StaffPendingPayments />} />
            <Route path="payment-history" element={<StaffPaymentHistory />} />
          </Route>

          <Route path="/kitchen" element={<KitchenLayout />}>
            <Route index element={<KitchenOrders />} />
          </Route>

          {/* AdminLayout: kiểm tra JWT + khung menu; mỗi Route con = một màn hình quản lý */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="tables" element={<AdminTables />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="stats" element={<AdminStats />} />
            <Route path="payment-methods" element={<AdminPaymentMethods />} />
            <Route path="ratings" element={<AdminRatings />} />
          </Route>

          <Route path="*" element={<Navigate to="/scan" replace />} />
        </Routes>
      </CartProvider>
    </TableProvider>
  )
}

export default App

