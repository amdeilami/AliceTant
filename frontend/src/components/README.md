# Components Directory

This directory contains reusable React components used throughout the application.

## Components

### Header.jsx
Navigation header component that appears at the top of every page.
- Displays the AliceTant logo/brand
- Contains navigation links (Home, About, Services)
- Includes authentication buttons (Login, Sign Up)

### Footer.jsx
Footer component that appears at the bottom of every page.
- Brand information
- Quick links section
- Legal links (Privacy Policy, Terms of Service)
- Copyright notice

### Layout.jsx
Wrapper component that provides consistent page structure.
- Wraps pages with Header and Footer
- Ensures proper flex layout for sticky footer
- Used by all page components

## Usage

```jsx
import Layout from '../components/Layout';

function MyPage() {
  return (
    <Layout>
      {/* Your page content here */}
    </Layout>
  );
}
```
