import { useEffect, useState } from 'react';
import { getPublicSiteScripts } from '../lib/api';

export function PublicScripts() {
  useEffect(() => {
    getPublicSiteScripts().then(data => {
      if (data.head_scripts) {
        const div = document.createElement('div');
        div.innerHTML = data.head_scripts;
        Array.from(div.children).forEach(el => {
          const clone = document.createElement(el.tagName);
          Array.from(el.attributes).forEach(attr => clone.setAttribute(attr.name, attr.value));
          clone.textContent = el.textContent;
          clone.dataset.customScript = 'true';
          document.head.appendChild(clone);
        });
      }
      if (data.body_scripts) {
        const div = document.createElement('div');
        div.innerHTML = data.body_scripts;
        Array.from(div.children).forEach(el => {
          const clone = document.createElement(el.tagName);
          Array.from(el.attributes).forEach(attr => clone.setAttribute(attr.name, attr.value));
          clone.textContent = el.textContent;
          clone.dataset.customScript = 'true';
          document.body.appendChild(clone);
        });
      }
    }).catch(() => {});

    return () => {
      document.querySelectorAll('[data-custom-script="true"]').forEach(el => el.remove());
    };
  }, []);

  return null;
}

export function useDemoBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    getPublicSiteScripts().then(data => {
      if (data.demo_banner_enabled && data.demo_banner_text) {
        setBanner({
          text: data.demo_banner_text,
          color: data.demo_banner_color || '#f97316',
          link: data.demo_banner_link || '',
        });
      }
    }).catch(() => {});
  }, []);

  return banner;
}
