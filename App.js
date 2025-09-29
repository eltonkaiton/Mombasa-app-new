import { enableScreens } from 'react-native-screens';
enableScreens();

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ✅ Authentication
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// 🎫 Passenger
import PassengerHome from './screens/PassengerHome';
import BookFerryScreen from './screens/BookFerryScreen';
import MyBookingsScreen from './screens/MyBookingsScreen';
import PassengerDashboard from './screens/PassengerDashboard';

// 👨‍💼 Admin & Staff
import AdminHome from './screens/AdminHome';
import StaffHome from './screens/StaffHome';

// 💰 Finance
import FinanceHome from './screens/FinanceHome';
import ReceiptViewer from './screens/ReceiptViewer';
import FinanceReportScreen from './screens/FinanceReportScreen';
import FinanceOrdersScreen from './screens/FinanceOrdersScreen';

// 🚢 Supplier
import SupplierHome from './screens/SupplierHome';
import SupplyRequestsScreen from './screens/SupplyRequestsScreen';
import UploadInventoryScreen from './screens/UploadInventoryScreen';
import PaymentStatusScreen from './screens/PaymentStatusScreen';
import SupplierChatScreen from './screens/SupplierChatScreen';

// 🏷️ Inventory Staff
import InventoryScreen from './screens/InventoryScreen';
import StockDeliveriesScreen from './screens/StockDeliveriesScreen';
import InventoryReportScreen from './screens/InventoryReportScreen';
import ViewInventoryScreen from './screens/ViewInventoryScreen';
import OrderInventoryScreen from './screens/OrderInventoryScreen';
import InventoryChatScreen from './screens/InventoryChatScreen';

// 🚢 Ferry Crew
import FerryCrewScreen from './screens/FerryCrewScreen';
import FerriesScreen from './screens/FerriesScreen'; 

// ℹ️ Shared Info Pages
import AboutUsScreen from './screens/AboutUsScreen';
import HelpScreen from './screens/HelpScreen';
import ContactUsScreen from './screens/ContactUsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* 🔐 Authentication */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }} 
        />

        {/* 🎫 Passenger */}
        <Stack.Screen 
          name="PassengerHome" 
          component={PassengerHome} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="BookFerry" 
          component={BookFerryScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MyBookings" 
          component={MyBookingsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="PassengerDashboard" 
          component={PassengerDashboard} 
          options={{ headerShown: false }} 
        />

        {/* 👨‍💼 Admin & Staff */}
        <Stack.Screen 
          name="AdminHome" 
          component={AdminHome} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="StaffHome" 
          component={StaffHome} 
          options={{ headerShown: false }} 
        />

        {/* 💰 Finance */}
        <Stack.Screen 
          name="FinanceHome" 
          component={FinanceHome} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ReceiptViewer" 
          component={ReceiptViewer} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="FinanceReport" 
          component={FinanceReportScreen} 
        />
        <Stack.Screen 
          name="FinanceOrders" 
          component={FinanceOrdersScreen} 
          options={{ title: 'Approve Orders' }} 
        />

        {/* 🚢 Supplier */}
        <Stack.Screen 
          name="SupplierHome" 
          component={SupplierHome} 
        />
        <Stack.Screen 
          name="SupplyRequests" 
          component={SupplyRequestsScreen} 
        />
        <Stack.Screen 
          name="UploadInventory" 
          component={UploadInventoryScreen} 
        />
        <Stack.Screen 
          name="PaymentStatus" 
          component={PaymentStatusScreen} 
        />
        <Stack.Screen 
          name="SupplierChat" 
          component={SupplierChatScreen} 
        />

        {/* 🏷️ Inventory Staff */}
        <Stack.Screen 
          name="InventoryHome" 
          component={InventoryScreen} 
        />
        <Stack.Screen 
          name="StockDeliveries" 
          component={StockDeliveriesScreen} 
        />
        <Stack.Screen 
          name="InventoryReport" 
          component={InventoryReportScreen} 
        />
        <Stack.Screen 
          name="ViewInventory" 
          component={ViewInventoryScreen} 
        />
        <Stack.Screen 
          name="OrderInventory" 
          component={OrderInventoryScreen} 
        />
        <Stack.Screen 
          name="InventoryChat" 
          component={InventoryChatScreen} 
          options={{ title: 'Inventory Chat' }} 
        />

        {/* 🚢 Ferry Crew */}
        <Stack.Screen 
          name="FerryCrewHome" 
          component={FerryCrewScreen} 
          options={{ title: 'Ferry Operations' }} 
        />
        {/* ✅ Added */}
        <Stack.Screen 
          name="FerriesScreen" 
          component={FerriesScreen} 
          options={{ title: 'Ferries' }} 
        />

        {/* ℹ️ Shared Info Pages */}
        <Stack.Screen 
          name="AboutUs" 
          component={AboutUsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Help" 
          component={HelpScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ContactUs" 
          component={ContactUsScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
