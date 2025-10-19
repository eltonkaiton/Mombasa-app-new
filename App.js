// App.js
import { enableScreens } from "react-native-screens";
enableScreens();

import React from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ✅ Set global defaults for all TextInput fields
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.placeholderTextColor = "#999";
TextInput.defaultProps.selectionColor = "#FF6B35"; // Forge Reactor accent color
TextInput.defaultProps.style = { color: "#000" };

// ✅ Authentication
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";

// 🎫 Passenger
import PassengerHome from "./screens/PassengerHome";
import BookFerryScreen from "./screens/BookFerryScreen";
import MyBookingsScreen from "./screens/MyBookingsScreen";
import PassengerDashboard from "./screens/PassengerDashboard";
import ChatScreen from "./screens/ChatScreen";

// 👨‍💼 Admin & Staff
import AdminHome from "./screens/AdminHome";
import StaffHome from "./screens/StaffHome";

// 💰 Finance
import FinanceHome from "./screens/FinanceHome";
import ReceiptViewer from "./screens/ReceiptViewer";
import FinanceReportScreen from "./screens/FinanceReportScreen";
import FinanceOrdersScreen from "./screens/FinanceOrdersScreen";

// 🚢 Supplier
import SupplierHome from "./screens/SupplierHome";
import SupplyRequestsScreen from "./screens/SupplyRequestsScreen";
import UploadInventoryScreen from "./screens/UploadInventoryScreen";
import PaymentStatusScreen from "./screens/PaymentStatusScreen";
import SupplierChatScreen from "./screens/SupplierChatScreen";

// 🏷️ Inventory Staff
import InventoryScreen from "./screens/InventoryScreen";
import StockDeliveriesScreen from "./screens/StockDeliveriesScreen";
import InventoryReportScreen from "./screens/InventoryReportScreen";
import ViewInventoryScreen from "./screens/ViewInventoryScreen";
import OrderInventoryScreen from "./screens/OrderInventoryScreen";
import InventoryChatScreen from "./screens/InventoryChatScreen";

// 🚢 Ferry Crew
import FerryCrewScreen from "./screens/FerryCrewScreen";
import FerriesScreen from "./screens/FerriesScreen";

// 🧭 Service Manager
import ServiceManagerScreen from "./screens/ServiceManagerScreen"; // ✅ NEW

// ℹ️ Shared Info Pages
import AboutUsScreen from "./screens/AboutUsScreen";
import HelpScreen from "./screens/HelpScreen";
import ContactUsScreen from "./screens/ContactUsScreen";

// ✅ Global Footer Component
const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>
      © 2025 <Text style={styles.footerBrand}>Forge Reactor</Text> | Forging Digital Innovation
    </Text>
  </View>
);

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#1A1F2E", // Forge Reactor dark navy
            },
            headerTintColor: "#FF6B35", // Forge Reactor orange accent
            headerTitleStyle: {
              fontWeight: "700",
              fontSize: 18,
            },
          }}
        >
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
            options={{ 
              title: "Book Ferry",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen
            name="MyBookings"
            component={MyBookingsScreen}
            options={{ 
              title: "My Bookings",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen
            name="PassengerDashboard"
            component={PassengerDashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              title: "Chat with Operation Staff",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
              headerTitleStyle: { fontWeight: "bold" },
            }}
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
            options={{ 
              title: "Receipt Viewer",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen
            name="FinanceReport"
            component={FinanceReportScreen}
            options={{ 
              title: "Financial Reports",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen
            name="FinanceOrders"
            component={FinanceOrdersScreen}
            options={{ 
              title: "Approve Orders",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />

          {/* 🚢 Supplier */}
          <Stack.Screen 
            name="SupplierHome" 
            component={SupplierHome} 
            options={{ 
              title: "Supplier Portal",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen 
            name="SupplyRequests" 
            component={SupplyRequestsScreen} 
            options={{ 
              title: "Supply Requests",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen 
            name="UploadInventory" 
            component={UploadInventoryScreen} 
            options={{ 
              title: "Upload Inventory",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen 
            name="PaymentStatus" 
            component={PaymentStatusScreen} 
            options={{ 
              title: "Payment Status",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen 
            name="SupplierChat" 
            component={SupplierChatScreen} 
            options={{ 
              title: "Supplier Chat",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />

          {/* 🏷️ Inventory Staff */}
          <Stack.Screen 
            name="InventoryHome" 
            component={InventoryScreen} 
            options={{ 
              title: "Inventory Management",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen 
            name="StockDeliveries" 
            component={StockDeliveriesScreen} 
            options={{ 
              title: "Stock Deliveries",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen 
            name="InventoryReport" 
            component={InventoryReportScreen} 
            options={{ 
              title: "Inventory Reports",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen 
            name="ViewInventory" 
            component={ViewInventoryScreen} 
            options={{ 
              title: "View Inventory",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen 
            name="OrderInventory" 
            component={OrderInventoryScreen} 
            options={{ 
              title: "Order Inventory",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen
            name="InventoryChat"
            component={InventoryChatScreen}
            options={{ 
              title: "Inventory Chat",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />

          {/* 🚢 Ferry Crew */}
          <Stack.Screen
            name="FerryCrewHome"
            component={FerryCrewScreen}
            options={{ 
              title: "Ferry Operations",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />
          <Stack.Screen
            name="FerriesScreen"
            component={FerriesScreen}
            options={{ 
              title: "Ferry Management",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
          />

          {/* 🧭 Service Manager */}
          <Stack.Screen
            name="ServiceManager"
            component={ServiceManagerScreen}
            options={{ 
              title: "Service Manager Portal",
              headerStyle: { backgroundColor: "#1A1F2E" },
              headerTintColor: "#FF6B35",
            }}
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

        {/* 🌍 Global Footer */}
        <Footer />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    backgroundColor: "#1A1F2E", // Forge Reactor dark navy
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#FF6B35", // Forge Reactor orange accent
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  footerText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  footerBrand: {
    color: "#FF6B35", // Forge Reactor orange
    fontWeight: "700",
  },
});
