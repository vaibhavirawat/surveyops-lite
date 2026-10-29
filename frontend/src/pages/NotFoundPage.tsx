import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" subtitle="That address does not exist." />
      <Link to="/" className="font-medium text-teal-700 hover:underline">
        Back to the dashboard
      </Link>
    </>
  )
}
