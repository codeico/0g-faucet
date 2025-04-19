/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)', // berlaku untuk semua path
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow', // Mengizinkan pengindeksan dan mengikuti link
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
