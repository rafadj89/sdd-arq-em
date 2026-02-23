import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="py-20 md:py-32 px-4 min-h-[calc(100vh-400px)] flex items-center">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="mb-8">
            <h1 className="text-7xl md:text-8xl font-bold text-primary">
              404
            </h1>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Page Not Found
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            The page you're looking for doesn't exist. It might have been moved
            or removed.
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors group"
          >
            Back to Home
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
