# Krita 3D Pipeline Bridge

## Krita Plugin Setup

1. Clone this repository into your **pykrita** folder.
   > **Note:** You can find this folder by opening **Krita** and navigating to:
   >
   > **Settings → Manage Resources → Open Resource Folder**

2. Restart **Krita** so it recognizes the new plugin files.

3. Go to:

   **Settings → Configure Krita → Plugin Manager**

4. Find the newly added plugin in the list and enable it.

5. Restart **Krita** again to apply the changes.

6. Open a canvas, then enable the plugin from the **Dockers** panel.

---

## Electron App Setup

1. Open your terminal and navigate to the Electron app directory:

   ```bash
   cd "Krita 3D Electron App"
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

3. Start the application in development mode:

   ```bash
   npm run dev
   ```

4. The application will launch and display a temporary scene.

5. To begin your own project, navigate to:

   **File → Open Project**

   and select or create a project to start working.
