export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-orbit-bg border-t border-orbit-border px-6 py-2">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-orbit-text-secondary">
        <div className="mx-auto flex items-center gap-2">
          <p className="">
            © {currentYear} Orbit. All rights reserved by <a href="https://github.com/benjaminnjihianjami-sys" target="_blank" className="font-bold text-green-700">Benjamin Njami</a> • Distributed by <a href="https://themewagon.com" target="_blank" className="font-bold text-green-700">ThemeWagon</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
