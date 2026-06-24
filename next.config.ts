import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Restrict the Next image optimizer to known hosts. A wildcard ('**') turns
    // the optimizer into an open fetch proxy for any user-supplied imageUrl.
    // Menu item photos are stored as data URLs / local uploads, plus the avatar service.
    remotePatterns: [{ protocol: 'https', hostname: 'ui-avatars.com' }]
  }
};

export default nextConfig;
