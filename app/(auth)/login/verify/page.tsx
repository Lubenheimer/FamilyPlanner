import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="text-4xl mb-2">📬</div>
        <CardTitle>Link gesendet!</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <p className="text-muted-foreground text-sm">
          Schau in dein E-Mail-Postfach. Klick auf den Link darin, um dich anzumelden.
        </p>
        <p className="text-xs text-muted-foreground">
          Kein E-Mail bekommen? Prüf den Spam-Ordner oder versuche es erneut.
        </p>
      </CardContent>
    </Card>
  );
}
