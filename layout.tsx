import Script from "next/script";

export const metadata = {
title: "NiceWins",
description: "NiceWins Affiliate Platform"
};

export default function RootLayout({
children
}: {
children: React.ReactNode;
}) {
return (
<html lang="hu">
<body style={{
margin: 0,
background: "#101923",
color: "white",
fontFamily: "Arial, sans-serif"
}}>
<Script
src="https://telegram.org/js/telegram-web-app.js"
strategy="beforeInteractive"
/>
{children}
</body>
</html>
);
}
