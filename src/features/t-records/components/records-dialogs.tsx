import { RecordActionDialog } from './record-action-dialog'
import { useRecords } from './records-provider'

export function RecordsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useRecords()
  return (
    <>
      <RecordActionDialog
        key={
          open === 'update' && currentRow
            ? `record-update-${currentRow.id}`
            : 'record-create'
        }
        open={open === 'create' || (open === 'update' && !!currentRow)}
        onOpenChange={(val) => {
          if (!val) {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 500)
          }
        }}
        record={open === 'update' ? (currentRow ?? undefined) : undefined}
        onSuccess={() => {
          setOpen(null)
          setTimeout(() => setCurrentRow(null), 500)
        }}
      />
    </>
  )
}
