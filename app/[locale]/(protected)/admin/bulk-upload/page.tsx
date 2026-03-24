import { BulkUploadForm } from "@/components/forms/bulk-upload-form"

export default function BulkUploadPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Bulk Upload</h1>
        <p className="text-muted-foreground mt-1">
          Upload Excel or CSV files to bulk create users or schedules
        </p>
      </div>
      <BulkUploadForm />
    </div>
  )
}
