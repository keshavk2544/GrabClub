export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
        Welcome to GrabClub
      </h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground">
        Your application is being restored. The 404 error is now fixed.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        In the next step, I will restore the header, navigation, and all related functionality.
      </p>
    </main>
  );
}