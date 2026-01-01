# GoalPlanner Pro 🎯

AI-powered goal planning that transforms your big ambitions into actionable steps with smart coaching and progress tracking.

## ✨ Features

### 🤖 AI-Powered Planning
- **Smart Goal Breakdown**: AI analyzes your goals and creates detailed, actionable step-by-step plans
- **Intelligent Step Expansion**: Break down complex steps into smaller, manageable sub-tasks
- **Personalized Coaching**: Get contextual advice and motivation based on your progress

### 📊 Progress Tracking
- **Visual Progress Bars**: See your advancement at a glance
- **Check-in System**: Daily mood tracking with notes to maintain momentum
- **Analytics & Insights**: Track completion rates, identify patterns, and get predictive completion dates
- **Streak Tracking**: Build and maintain positive habits

### 🎯 Goal Management
- **5-Step Goal Wizard**: Guided creation process for meaningful goals
- **Flexible Goal Status**: Active, paused, completed, or abandoned - you're in control
- **Privacy Controls**: Private, public, or unlisted goals
- **Deadline Management**: Set and track target dates with smart reminders

### 🏆 Social & Gamification
- **Public Goal Pages**: Share your journey and inspire others
- **Achievement System**: Unlock badges as you progress (Bronze, Silver, Gold, Diamond)
- **Emoji Reactions**: Get encouragement from the community
- **Shareable Progress Cards**: Beautiful auto-generated images for social media

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account (for database)
- Clerk account (for authentication)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/goalplanner-pro.git
cd goalplanner-pro
```

2. **Install dependencies**
```bash
pnpm install
# or
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. **Set up the database**
```bash
pnpm db:push
```

5. **Run the development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start planning your goals!

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI**: [OpenRouter](https://openrouter.ai/) with multiple model support
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)

## 📱 Screenshots

<!-- Add your screenshots here -->
![Dashboard](/public/dashboard-screenshot.png)
![Goal Detail](/public/goal-detail-screenshot.png)
![AI Planning](/public/ai-planning-screenshot.png)

## 🎯 Use Cases

- **Career Development**: Plan skill acquisition, job transitions, and professional growth
- **Health & Fitness**: Create structured workout plans and nutrition goals
- **Learning Projects**: Break down complex subjects into manageable study sessions
- **Business Goals**: Plan product launches, marketing campaigns, and growth targets
- **Personal Growth**: Develop habits, learn new skills, and achieve life milestones

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=your_supabase_database_url

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI
OPENROUTER_API_KEY=your_openrouter_api_key

# Email (optional)
RESEND_API_KEY=your_resend_api_key
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Netlify
```bash
pnpm build
# Deploy the .next directory to Netlify
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.goalplanner.pro](https://docs.goalplanner.pro)
- **Discord Community**: [Join our Discord](https://discord.gg/goalplanner)
- **Twitter**: [@GoalPlannerPro](https://twitter.com/goalplannerpro)
- **Email**: support@goalplanner.pro

## 🎉 Product Hunt

🎯 **Launching on Product Hunt!** 

If you find GoalPlanner Pro helpful, we'd appreciate your support:
- **Upvote** on our launch day
- **Share** your goals and progress
- **Leave feedback** to help us improve

---

*Built with ❤️ by the GoalPlanner team*
