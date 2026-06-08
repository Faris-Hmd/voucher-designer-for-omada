export default function manifest() {
  return {
    name: "Voucher Designer",
    short_name: "Voucher Designer",
    description: "تصميم وطباعة كروت شبكة الواي فاي لنظامي أومادا ورويجي",
    start_url: "/",
    display: "standalone",
    background_color: "#f0f4f8",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
