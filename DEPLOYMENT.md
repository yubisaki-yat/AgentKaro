# 🚀 AgentKaro Deployment Guide

This guide provides step-by-step instructions for deploying the **AgentKaro** project (Frontend + Backend) to Render, setting up **MongoDB Atlas**, and integrating **Razorpay**.

---

## 1. 🗄️ Database Setup (MongoDB Atlas)

To use a cloud database instead of a local one, follow these steps:

1.  **Sign Up**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2.  **Create a Cluster**: Click on **"Create Cluster"**, choose **Shared (FREE)** tier, and select a provider/region (closest to your users).
3.  **Database User**: Go to **Database Access** -> **+ Add New Database User**. Use **"Password"** authentication, Create a username/password, and give **"atlasAdmin"** role.
4.  **Network Access**: Go to **Network Access** -> **+ Add IP Address**.
    - For development: Click **"Add Current IP Address"**.
    - For Render: Click **"Allow Access from Anywhere"** (0.0.0.0/0). *Render IPs are dynamic.*
5.  **Get Connection String**: Go to **Database** -> **Browse Collections** -> **Connect**. Choose **"Connect your application"**.
    - Copied String: `mongodb+srv://<db_username>:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6.  **Update `.env`**: Replace `<db_password>` with your actual password. This will be your `MONGO_URI`.

---

## 2. 💳 Payment Gateway (Razorpay)

1.  **Sign Up**: Go to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2.  **Test Mode**: Ensure you are in **"Test Mode"** (top right corner) for development.
3.  **Generate API Keys**: Go to **Settings** -> **API Keys** -> **Generate Key ID and Secret**.
4.  **Copy keys**: Save these as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.

---

## 3. 🌐 Deploying to Render

Render works best when you deploy the **Frontend** and **Backend** separately.

### A. Backend Deployment (Web Service)

Since the bots require **Selenium/Chrome**, you **MUST** deploy using **Docker**.

1.  **New Web Service**: In Render Dashboard, click **"New"** -> **"Web Service"**.
2.  **Repository**: Connect your GitHub repository (`AgentKaro`).
3.  **Runtime**: Select **"Docker"** (Do not select Python). Render will automatically find the `Dockerfile` in the repository.
4.  **Environment Variables**: Add the following keys under the **"Environment"** tab:
    - `MONGO_URI`: (Your MongoDB Atlas string)
    - `RAZORPAY_KEY_ID`: (Your Razorpay ID)
    - `RAZORPAY_KEY_SECRET`: (Your Razorpay Secret)
    - `ADMIN_PASSWORD`: (Choose an admin password)
    - `GOOGLE_CLIENT_ID`: (From Google Cloud Console)
    - `GITHUB_CLIENT_ID`: (From GitHub Developer Settings)
    - `GITHUB_CLIENT_SECRET`: (From GitHub Developer Settings)
5.  **Deploy**: Click **"Create Web Service"**. It may take a few minutes to build the Docker image.

### B. Frontend Deployment (Static Site)

1.  **New Static Site**: Click **"New"** -> **"Static Site"**.
2.  **Repository**: Connect the same GitHub repository.
3.  **Build Settings** (⚠️ **IMPORTANT**):
    - **Root Directory**: `frontend` *(Do this so it doesn't mistakenly try to build the Python backend!)*
    - **Build Command**: `npm install && npm run build`
    - **Publish Directory**: `dist`
4.  **Environment Variables**: Add:
    - `VITE_API_URL`: (The URL of your **Backend Web Service** on Render, e.g., `https://agentkaro-backend.onrender.com/api`)
5.  **Deploy**: Click **"Create Static Site"**.

---

## 4. 📝 Required Environment Variables

| Variable | Description | Source |
| :--- | :--- | :--- |
| `MONGO_URI` | MongoDB Connection String | MongoDB Atlas |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret | Razorpay Dashboard |
| `ADMIN_PASSWORD` | Password for Admin panel | Any secure string |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | Google Cloud Console |
| `GITHUB_CLIENT_ID` | OAuth Client ID | GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret | GitHub Developer Settings |

---

## ⚠️ Important Notes

- **Docker for Selenium**: The provided `Dockerfile` installs Chrome/Chromedriver. This is necessary because Render's default Python environment doesn't have them.
- **Port**: The backend is configured to run on Port **8000** (exposed in Dockerfile). Render will detect this automatically.
- **CORS**: Ensure the Backend has your Render Frontend URL in its `allow_origins` in `main.py` (or keep it as `["*"]` for initial testing).

---

## 🛠️ Common Errors & Troubleshooting

- **`bash: line 1: added:: command not found`**: You will get this if you accidentally copy the word `added:` or any other random text into the `Build Command` or into an `Environment Variable` key. **Ensure your Build Command is EXACTLY `npm install && npm run build`** with nothing extra pasted in the box.
- **Python / Pip installing on Frontend**: If Render starts installing `uvicorn`, `fastapi`, and other Python packages while deploying the Frontend Static Site, it means you forgot to set the **Root Directory** to `frontend`. It's detecting the `requirements.txt` in the root and acting as a Python app.

---

### Step-by-Step Summary:
1.  **Register accounts** for MongoDB Atlas, Razorpay, and Render.
2.  **Push your latest code** to GitHub.
3.  **Deploy Backend on Render**: Create a new Web Service, choose Docker Runtime, and set the environment variables.
4.  **Deploy Frontend on Render**: Create a new Static Site, set **Root Directory** to `frontend`, set **Build Command** to `npm install && npm run build`, and link `VITE_API_URL` to your backend URL.
