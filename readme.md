# Focus Tube: AI-Powered Intent-Based YouTube Feed !

![Focus Tube Logo](logo.png)

**Reclaim your attention.** Focus Tube replaces the distracting, algorithm-driven YouTube homepage with a clean, intent-based feed curated by Artificial Intelligence. 

Instead of doom-scrolling through random recommendations, you tell Focus Tube what you want to learn, and it builds a custom feed of high-quality, long-form content just for you.

---

## Key Features

### AI-Powered Curation (Gemini)
We don't just search for keywords. We use **Google's Gemini LLM** to understand your intent.
- If you type *"React"*, the AI converts it into smart queries like *"React JS Full Course 2024"*, *"React Hooks Deep Dive"*, and *"React Best Practices"*.
- This ensures you get educational, high-value content instead of clickbait.

### The Protocol
- **No Distractions:** The default YouTube feed is hidden immediately upon loading.
- **Intent First:** You are greeted by a minimal modal asking: *"What do you want to learn today?"*
- You cannot browse until you set an intention.

### Infinite Scroll
- Enjoy a seamless browsing experience. As you reach the bottom of your curated feed, the extension automatically fetches the next batch of relevant videos using the YouTube API's pagination system.

### "Favorites" Bias Engine
- Tell the extension who your trusted creators are (e.g., *Veritasium, Fireship*).
- The AI will intelligently mix videos from your favorite channels into your search results, ensuring a personalized feed without tracking your history.

### Quota Rescue & Resilience
- **Smart Fallback:** The extension comes with default API keys for instant use.
- **Quota Protection:** If the shared API limit is reached, a "Rescue Modal" appears, allowing you to plug in your own free YouTube & Gemini keys to keep browsing interruption-free.

---

## TechStack

* **Manifest V3:** Built on the latest Chrome Extension standard for security and performance.
* **YouTube Data API v3:** Fetches video metadata, thumbnails, and channel info.
* **Google Gemini API:** Provides the LLM intelligence for query expansion and curation.
* **Vanilla JavaScript (ES6+):** No heavy frameworks. Lightweight and blazing fast.
* **CSS3:** Custom responsive grid and "Dark Mode" UI that matches YouTube's native aesthetic perfectly.

---

## Installation & Setup Guide

Since this is a developer-focused extension, you can install it manually in developer mode.

### Prerequisites
1.  Download or Clone this repository to your computer.
    ```bash
    git clone [https://github.com/your-username/focus-tube.git](https://github.com/your-username/focus-tube.git)
    ```
2.  (Optional) Get your own free API keys if you want to use it heavily:
    - **YouTube Data API v3:** [Get Key Here](https://console.cloud.google.com/apis/credentials)
    - **Gemini API:** [Get Key Here](https://aistudio.google.com/app/apikey)

### Steps to Install
1.  Open Google Chrome (or Brave/Edge).
2.  Type `chrome://extensions` in the address bar.
3.  Toggle **Developer mode** in the top right corner.
4.  Click the **Load unpacked** button in the top left.
5.  Select the folder where you downloaded this code (`focus-tube-extension`).
6.  Go to **YouTube.com** and enjoy your focus!

---

## Configuration (Optional)

### Using Your Own API Keys
If you see a "Quota Exceeded" message or just want private access:
1.  Wait for the **Quota Rescue Modal** to appear (it triggers automatically on error).
2.  Or, check the code in `content.js` and replace `DEFAULT_YT_KEY` and `DEFAULT_GEM_KEY` with your own.

### Managing Favorites
1.  On the "What do you want to learn?" screen, click the **Settings (Gear)** icon in the top right.
2.  Enter your favorite channels (comma-separated).
3.  Click **Save**. The AI will now prioritize these creators.

---

## Contributing

Contributions are welcome! If you have ideas for:
* Better prompt engineering for the AI.
* UI improvements.
* New filtering options (e.g., filter by view count).

Feel free to fork the repo and submit a Pull Request.

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

*Built with focus by Goldi Rathore*