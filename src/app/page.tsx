export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0B0F14",
      color: "#E5E7EB",
      fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji"
    }}>
      <h1 style={{
        fontSize: 32,
        letterSpacing: 0.5,
        textShadow: "0 0 24px rgba(34,211,238,0.25)",
      }}>
        Hello from Vibe Hunter
      </h1>
    </main>
  );
}
