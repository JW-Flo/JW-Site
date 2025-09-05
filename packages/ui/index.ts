// Shared UI components and design system

export interface ButtonProps {
  children: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600 focus:ring-slate-500 border border-slate-600',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-lg hover:shadow-xl',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return `<button class="${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}" ${disabled ? 'disabled' : ''} ${onClick ? 'onclick="onClick()"' : ''}>${children}</button>`;
};

export interface LayoutShellProps {
  title: string;
  children: string;
}

export const LayoutShell = ({ title, children }: LayoutShellProps) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        .nav-link { transition: all 0.2s ease; }
        .nav-link:hover { transform: translateY(-1px); }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .glass-effect { backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1); }
      </style>
    </head>
    <body class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 min-h-screen">
      <!-- Header -->
      <header class="glass-effect border-b border-slate-700/50 sticky top-0 z-50">
        <nav class="container mx-auto px-6 py-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">AI</span>
              </div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AtlasIT</h1>
            </div>
            
            <!-- Desktop Navigation -->
            <div class="hidden md:flex items-center space-x-1">
              <a href="/dashboard" class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200">Dashboard</a>
              <a href="/onboarding" class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200">Onboarding</a>
              <a href="/marketplace" class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200">Marketplace</a>
              <a href="/orchestrator" class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200">Orchestrator</a>
              <a href="/api-manager" class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200">API Manager</a>
              
              <!-- IT Dropdown -->
              <div class="relative group">
                <button class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center">
                  IT <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="absolute top-full left-0 mt-1 w-48 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-700">
                  <a href="/it/policies" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-t-lg">Policies</a>
                  <a href="/it/backup" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50">Backup & Recovery</a>
                </div>
              </div>
              
              <!-- Security Dropdown -->
              <div class="relative group">
                <button class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center">
                  Security <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="absolute top-full left-0 mt-1 w-48 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-700">
                  <a href="/security" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-t-lg">Security Center</a>
                  <a href="/enhanced-security-scanner" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-b-lg">Scanner</a>
                </div>
              </div>
              
              <!-- Governance Dropdown -->
              <div class="relative group">
                <button class="nav-link px-4 py-2 rounded-lg hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200 flex items-center">
                  Governance <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="absolute top-full left-0 mt-1 w-48 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-700">
                  <a href="/governance/compliance" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Compliance</a>
                </div>
              </div>
              
              <div class="w-px h-6 bg-slate-600 mx-2"></div>
              <a href="/login" class="nav-link px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200">Login</a>
              <a href="/register" class="nav-link px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200">Register</a>
            </div>
            
            <!-- Mobile Menu Button -->
            <button id="mobile-menu-btn" class="md:hidden text-slate-300 hover:text-white p-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
          
          <!-- Mobile Menu -->
          <div id="mobile-menu" class="hidden md:hidden mt-4 pb-4 space-y-2 border-t border-slate-700 pt-4">
            <a href="/dashboard" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Dashboard</a>
            <a href="/onboarding" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Onboarding</a>
            <a href="/marketplace" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Marketplace</a>
            <a href="/orchestrator" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Orchestrator</a>
            <a href="/api-manager" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">API Manager</a>
            <a href="/it/policies" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">IT Policies</a>
            <a href="/it/backup" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Backup & Recovery</a>
            <a href="/security" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Security Center</a>
            <a href="/governance/compliance" class="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">Compliance</a>
            <div class="pt-2 border-t border-slate-700 mt-4">
              <a href="/login" class="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center mb-2">Login</a>
              <a href="/register" class="block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-center">Register</a>
            </div>
          </div>
        </nav>
      </header>
      
      <!-- Main Content -->
      <main class="container mx-auto px-6 py-8">
        ${children}
      </main>
      
      <!-- Footer -->
      <footer class="glass-effect border-t border-slate-700/50 mt-16">
        <div class="container mx-auto px-6 py-8">
          <div class="flex flex-col md:flex-row justify-between items-center">
            <div class="flex items-center space-x-2 mb-4 md:mb-0">
              <div class="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                <span class="text-white font-bold text-xs">AI</span>
              </div>
              <span class="text-slate-400">© 2025 AtlasIT. Enterprise IT Automation Platform.</span>
            </div>
            <div class="flex space-x-6 text-sm text-slate-400">
              <a href="#" class="hover:text-slate-300 transition-colors">Privacy</a>
              <a href="#" class="hover:text-slate-300 transition-colors">Terms</a>
              <a href="#" class="hover:text-slate-300 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
      
      <script>
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        mobileMenuBtn?.addEventListener('click', () => {
          mobileMenu.classList.toggle('hidden');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
          if (!mobileMenuBtn?.contains(e.target) && !mobileMenu?.contains(e.target)) {
            mobileMenu?.classList.add('hidden');
          }
        });
      </script>
    </body>
    </html>
  `;
};

export interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Input = ({
  type = 'text',
  placeholder = '',
  value = '',
  name = '',
  required = false,
  disabled = false,
  className = '',
}: InputProps) => {
  const baseClasses = 'w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 placeholder-slate-400 text-slate-100';
  return `<input type="${type}" placeholder="${placeholder}" value="${value}" name="${name}" ${required ? 'required' : ''} ${disabled ? 'disabled' : ''} class="${baseClasses} ${className}" />`;
};

export interface CardProps {
  title: string;
  content: string;
  link?: {
    text: string;
    href: string;
  };
  className?: string;
}

export const Card = ({
  title,
  content,
  link,
  className = '',
}: CardProps) => {
  const baseClasses = 'glass-effect p-6 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl';
  return `
    <div class="${baseClasses} ${className}">
      <h2 class="text-xl font-semibold mb-3 text-slate-100">${title}</h2>
      <p class="text-slate-300 mb-4 leading-relaxed">${content}</p>
      ${link ? `<a href="${link.href}" class="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 group">
        ${link.text}
        <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </a>` : ''}
    </div>
  `;
};
