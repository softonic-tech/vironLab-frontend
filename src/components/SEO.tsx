import { useEffect } from 'react';
import { CONFIG } from '@/lib/config';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function SEO({
  title = 'Viron Labs - UK Peptides | Premium Research Compounds',
  description = 'Viron Labs offers premium quality peptides for research purposes. HPLC-verified ≥99% purity. Fast shipping across UK.',
  keywords = 'peptides, research peptides, UK peptides, Retatrutide, Semaglutide, Tirzepatide, NAD+, BPC-157, TB-500',
  ogImage = '/og-image.png',
  noIndex = false,
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage },
      { property: 'og:url', content: CONFIG.SITE_URL },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
    ];

    if (noIndex) {
      metaTags.push({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      metaTags.push({ name: 'robots', content: 'index, follow' });
    }

    metaTags.forEach(({ name, property, content }) => {
      let tag: HTMLMetaElement | null = null;
      if (property) {
        tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
      } else if (name) {
        tag = document.querySelector(`meta[name="${name}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('name', name);
          document.head.appendChild(tag);
        }
      }
      if (tag) {
        tag.setAttribute('content', content);
      }
    });

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', CONFIG.SITE_URL + window.location.hash.replace('#', ''));
  }, [title, description, keywords, ogImage, noIndex]);

  return null;
}

// Google Analytics
export function GoogleAnalytics() {
  useEffect(() => {
    if (!CONFIG.GA_MEASUREMENT_ID || CONFIG.GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', CONFIG.GA_MEASUREMENT_ID);

    // Track page views on route change
    const trackPageView = () => {
      gtag('event', 'page_view', {
        page_path: window.location.hash.replace('#', '') || '/',
        page_title: document.title,
      });
    };

    trackPageView();
    window.addEventListener('hashchange', trackPageView);

    return () => {
      window.removeEventListener('hashchange', trackPageView);
    };
  }, []);

  return null;
}

// Add gtag to window
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
export default SEO;