# Ragul M — Portfolio Website

A modern, dark-mode portfolio for a DevOps & Cloud Engineer. Built with Next.js 15, TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Lucide React**
- **Vercel** (deployment)

## 🌐 Pages

| Page | Route |
|------|-------|
| Home | `/` |
| About | `/about` |
| Projects | `/projects` |
| Skills | `/skills` |
| Resume | `/resume` |
| Contact | `/contact` |

## 🛠 Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Add Your Resume PDF

Place your resume at:
```
public/resume.pdf
```

## 🔗 Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Click **Deploy** — no configuration needed

Vercel auto-detects Next.js and deploys optimally.

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout with navbar/footer
│   ├── page.tsx         # Home page
│   ├── about/page.tsx
│   ├── projects/page.tsx
│   ├── skills/page.tsx
│   ├── resume/page.tsx
│   └── contact/page.tsx
└── components/
    ├── Navbar.tsx
    ├── Footer.tsx
    ├── KubeTerminal.tsx  # Animated K8s terminal
    ├── TypingAnimation.tsx
    └── Animations.tsx    # Framer Motion helpers
```

## 📄 License

MIT
