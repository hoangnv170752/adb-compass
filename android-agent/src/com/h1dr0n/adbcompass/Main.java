package com.h1dr0n.adbcompass;

import android.os.Looper;
import android.content.pm.PackageManager;

/**
 * Android Agent Entry Point.
 * Executed via app_process.
 */
public class Main {
    private static final String TAG = "ADBCompassAgent";
    private static final int DEFAULT_PORT = 12345;

    public static void main(String[] args) {
        System.out.println("DeviceHub Agent starting...");

        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException e) {
                System.err.println("Invalid port provided, using default: " + DEFAULT_PORT);
            }
        }

        try {
            // Prepare main looper for Android API calls
            if (Looper.getMainLooper() == null) {
                Looper.prepareMainLooper();
            }

            // Get PackageManager via reflection for app_process
            PackageManager pm = null;
            try {
                Class<?> activityThreadClass = Class.forName("android.app.ActivityThread");
                Object activityThread = activityThreadClass.getMethod("systemMain").invoke(null);
                Object context = activityThreadClass.getMethod("getSystemContext").invoke(activityThread);
                pm = (PackageManager) context.getClass().getMethod("getPackageManager").invoke(context);
                System.out.println("System context and PackageManager initialized.");
            } catch (Exception e) {
                System.err.println(
                        "Warning: Could not initialize PackageManager via reflection. Some features will be disabled.");
            }

            System.out.println("Listening on port: " + port);
            SocketServer server = new SocketServer(port, pm);
            server.run();

        } catch (Exception e) {
            System.err.println("Critical error in Agent: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
