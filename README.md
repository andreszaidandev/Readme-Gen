
# Readme-Gen: AI-Powered GitHub README Generator

Crafting a comprehensive and engaging `README.md` is crucial for any project, but it can often be a time-consuming task. Readme-Gen simplifies this by leveraging the power of Artificial Intelligence to generate high-quality, professional READMEs tailored to your GitHub repositories.

This web application provides a seamless experience for developers and project maintainers to quickly create, edit, and export polished README files, ensuring your projects always make a strong first impression.

<img width="1920" height="1080" alt="Screenshot 2026-03-10 145615" src="https://github.com/user-attachments/assets/19fad986-363c-4932-906e-f57f7ffc2af9" />
<img width="1920" height="1080" alt="Screenshot 2026-03-10 145539" src="https://github.com/user-attachments/assets/1c7cfea7-2e6e-4439-b9f1-d0ff72d1b951" />

---
## Live Preview
[View the live app](https://readme-gen-eta.vercel.app)
## 🚀 Features

*   **AI-Powered Generation:** Utilize Google Gemini to intelligently generate `README.md` content based on your project's context.
*   **GitHub Integration:** Connect with GitHub to fetch repository details and provide more accurate README suggestions.
*   **Interactive Markdown Editor:** A rich text editor for fine-tuning the generated Markdown, ensuring it perfectly matches your project's needs.
*   **Real-time Markdown Preview:** Instantly see how your `README.md` will render with a side-by-side preview panel.
*   **User Authentication:** Securely log in and manage your generated READMEs using Supabase authentication.
*   **Export Functionality:** Easily download your finalized `README.md` file.

## 🌟 Technologies

| Type             | Technology                                                                                                                                                                                                                                                                                                     |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**     | ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) |
| **UI Framework** | ![Shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)                                                                                                                                                                                                   |
| **Styling**      | ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)                                                                                                                                                                                           |
| **AI Service**   | ![Google Gemini](https://img.shields.io/badge/Google_Gemini-000000?style=for-the-badge&logo=google&logoColor=blue)                                                                                                                                                                                              |
| **Backend/Auth** | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)                                                                                                                                                                                                   |

## 📁 Project Structure

The project follows a standard React application structure, organized to clearly separate concerns:

```
Readme-Gen/
├── public/                       # Static assets (e.g., readme.png)
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Shadcn/ui components or similar primitives
│   │   ├── AuthModal.tsx         # User authentication dialog
│   │   ├── EditForm.tsx          # Form for editing generated content
│   │   ├── GenerateForm.tsx      # Form for initiating README generation
│   │   ├── MarkdownPanel.tsx     # Displays the Markdown preview
│   │   └── Toolbar.tsx           # Application toolbar
│   ├── lib/                      # Utility functions
│   │   └── utils.ts
│   ├── services/                 # API client integrations
│   │   ├── gemini.ts             # Google Gemini API client
│   │   ├── github.ts             # GitHub API client
│   │   └── supabase.ts           # Supabase client setup
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # Entry point for the React app
│   ├── types.ts                  # TypeScript custom type definitions
│   └── ... (CSS files)           # Styling for components and global styles
├── .env.example                  # Example environment variables
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite build configuration
```

## 🚀 Getting Started

Follow these instructions to set up and run Readme-Gen locally.

### Prerequisites

*   Node.js (LTS recommended)
*   npm or yarn
*   A Google Cloud project with the Gemini API enabled.
*   A Supabase project configured for authentication.
*   A GitHub OAuth App for client ID/secret integration.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/andreszaidandev/Readme-Gen.git
    cd Readme-Gen
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the root directory by copying `.env.example`:

    ```bash
    cp .env.example .env
    ```

    Then, populate the `.env` file with your API keys and project URLs:

    ```
    VITE_GEMINI_API_KEY=your_google_gemini_api_key
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
    VITE_GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
    ```
    *Refer to the respective service documentation for instructions on obtaining these credentials.*

### Running the Application

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will typically be accessible at `http://localhost:5173`.

## 💡 Usage

1.  **Authenticate:** Log in using the provided authentication modal, likely integrated with GitHub or another provider via Supabase.
2.  **Generate:** Input your GitHub repository URL or other relevant project details into the generation form.
3.  **Review & Edit:** The AI will generate a draft `README.md`. Review it in the Markdown preview panel and make any necessary edits using the interactive editor.
4.  **Export:** Download the finalized `README.md` file to your local machine.

## 🛣️ Roadmap

*   **Advanced Customization Options:** Allow users to specify sections, tone, and style for the generated README.
*   **Direct GitHub Integration:** Implement functionality to directly push the generated `README.md` to a GitHub repository.
*   **README Template Library:** Offer a selection of predefined `README.md` templates.
*   **Version History:** Track changes to generated READMEs and allow rollback.
*   **Dark Mode:** Provide a dark theme option for the user interface.

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements, new features, or bug fixes, please open an issue or submit a pull request.

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

Please ensure your code adheres to the project's coding style and includes relevant tests if applicable.

## 📜 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2023 Andres Zaidan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
```
