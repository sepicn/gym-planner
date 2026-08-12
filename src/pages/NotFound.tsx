import { Link } from "react-router-dom"
import { Button } from "../components/ui/Button"

export default function NotFound() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
      <div className="text-center">
        <p className="text-accent font-semibold mb-2">404</p>
        <h1 className="text-3xl font-bold mb-3">This page doesn&apos;t exist</h1>
        <p className="text-muted mb-8">
          The link may be broken, or the page may have moved.
        </p>
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </div>
  )
}
