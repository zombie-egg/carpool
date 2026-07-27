"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PHONE_REGEX } from "@/lib/constants";
import type { CarpoolCreatePayload, ContactType } from "@/lib/types";

interface FormState {
  organizerName: string;
  departLocation: string;
  destination: string;
  departDate: string;
  departTime: string;
  totalSeats: string;
  totalPrice: string;
  enableWechat: boolean;
  enablePhone: boolean;
  wechatId: string;
  phoneNumber: string;
  remark: string;
}

const INITIAL_STATE: FormState = {
  organizerName: "",
  departLocation: "",
  destination: "",
  departDate: "",
  departTime: "",
  totalSeats: "",
  totalPrice: "",
  enableWechat: false,
  enablePhone: false,
  wechatId: "",
  phoneNumber: "",
  remark: "",
};

type FieldErrors = Partial<Record<keyof FormState | "contact", string>>;

interface PublishFormProps {
  // Prefills the organizer nickname from the logged-in account.
  defaultOrganizer?: string;
}

// Full publish-a-trip form with bilingual validation messages.
export function PublishForm({ defaultOrganizer }: PublishFormProps) {
  const t = useTranslations("publish");
  const [form, setForm] = useState<FormState>({
    ...INITIAL_STATE,
    organizerName: defaultOrganizer ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "fail" | null>(null);

  const update = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.organizerName.trim()) next.organizerName = t("errors.required");
    if (!form.departLocation.trim()) next.departLocation = t("errors.required");
    if (!form.destination.trim()) next.destination = t("errors.required");
    if (!form.departDate) next.departDate = t("errors.required");
    if (!form.departTime) next.departTime = t("errors.required");
    if (form.departDate && form.departTime) {
      const departAt = new Date(`${form.departDate}T${form.departTime}`);
      if (departAt.getTime() <= Date.now()) {
        next.departTime = t("errors.pastTime");
      }
    }
    const seats = Number(form.totalSeats);
    if (
      form.totalSeats === "" ||
      !Number.isInteger(seats) ||
      seats < 1 ||
      seats > 50
    ) {
      next.totalSeats = t("errors.seats");
    }
    const price = Number(form.totalPrice);
    if (form.totalPrice === "" || Number.isNaN(price) || price < 0) {
      next.totalPrice = t("errors.price");
    }
    if (!form.enableWechat && !form.enablePhone) {
      next.contact = t("errors.contact");
    }
    if (form.enableWechat && !form.wechatId.trim()) {
      next.wechatId = t("errors.wechatRequired");
    }
    if (form.enablePhone) {
      if (!form.phoneNumber.trim()) {
        next.phoneNumber = t("errors.phoneRequired");
      } else if (!PHONE_REGEX.test(form.phoneNumber.trim())) {
        next.phoneNumber = t("errors.phone");
      }
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const contactType: ContactType =
      form.enableWechat && form.enablePhone
        ? "both"
        : form.enableWechat
          ? "wechat"
          : "phone";

    const payload: CarpoolCreatePayload = {
      organizerName: form.organizerName.trim(),
      departLocation: form.departLocation.trim(),
      destination: form.destination.trim(),
      departTime: new Date(
        `${form.departDate}T${form.departTime}`
      ).toISOString(),
      totalSeats: Number(form.totalSeats),
      totalPrice: Number(form.totalPrice),
      contactType,
      wechatId: form.enableWechat ? form.wechatId.trim() : undefined,
      phoneNumber: form.enablePhone ? form.phoneNumber.trim() : undefined,
      remark: form.remark.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/carpool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setResult("fail");
        return;
      }
      setResult("success");
      setForm({ ...INITIAL_STATE, organizerName: defaultOrganizer ?? "" });
      setErrors({});
    } catch {
      setResult("fail");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldError = (key: keyof FieldErrors) =>
    errors[key] ? (
      <p className="text-xs text-red-400">{errors[key]}</p>
    ) : null;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-xl border border-border bg-card/70 p-6 backdrop-blur sm:p-8"
    >
      <div className="space-y-1.5">
        <Label htmlFor="organizerName">{t("organizerName")}</Label>
        <Input
          id="organizerName"
          value={form.organizerName}
          placeholder={t("organizerPlaceholder")}
          onChange={(event) => update({ organizerName: event.target.value })}
        />
        {fieldError("organizerName")}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="departLocation">{t("departLocation")}</Label>
          <Input
            id="departLocation"
            value={form.departLocation}
            placeholder={t("departLocationPlaceholder")}
            onChange={(event) =>
              update({ departLocation: event.target.value })
            }
          />
          {fieldError("departLocation")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="destination">{t("destination")}</Label>
          <Input
            id="destination"
            value={form.destination}
            placeholder={t("destinationPlaceholder")}
            onChange={(event) => update({ destination: event.target.value })}
          />
          {fieldError("destination")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="departDate">{t("departDate")}</Label>
          <Input
            id="departDate"
            type="date"
            value={form.departDate}
            onChange={(event) => update({ departDate: event.target.value })}
          />
          {fieldError("departDate")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="departTime">{t("departTime")}</Label>
          <Input
            id="departTime"
            type="time"
            value={form.departTime}
            onChange={(event) => update({ departTime: event.target.value })}
          />
          {fieldError("departTime")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="totalSeats">{t("totalSeats")}</Label>
          <Input
            id="totalSeats"
            type="number"
            min="1"
            max="50"
            value={form.totalSeats}
            placeholder={t("seatsPlaceholder")}
            onChange={(event) => update({ totalSeats: event.target.value })}
          />
          {fieldError("totalSeats")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="totalPrice">{t("price")}</Label>
          <p className="text-xs text-muted-foreground">{t("priceHint")}</p>
          <Input
            id="totalPrice"
            type="number"
            min="0"
            step="0.01"
            value={form.totalPrice}
            placeholder={t("pricePlaceholder")}
            onChange={(event) => update({ totalPrice: event.target.value })}
          />
          {fieldError("totalPrice")}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium">{t("contactTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("contactHint")}</p>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.enableWechat}
              onCheckedChange={(checked) =>
                update({ enableWechat: checked === true })
              }
            />
            {t("enableWechat")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.enablePhone}
              onCheckedChange={(checked) =>
                update({ enablePhone: checked === true })
              }
            />
            {t("enablePhone")}
          </label>
        </div>
        {fieldError("contact")}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {form.enableWechat && (
            <div className="space-y-1.5">
              <Label htmlFor="wechatId">{t("wechatId")}</Label>
              <Input
                id="wechatId"
                value={form.wechatId}
                placeholder={t("wechatPlaceholder")}
                onChange={(event) => update({ wechatId: event.target.value })}
              />
              {fieldError("wechatId")}
            </div>
          )}
          {form.enablePhone && (
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">{t("phoneNumber")}</Label>
              <Input
                id="phoneNumber"
                value={form.phoneNumber}
                placeholder={t("phonePlaceholder")}
                onChange={(event) =>
                  update({ phoneNumber: event.target.value })
                }
              />
              {fieldError("phoneNumber")}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remark">{t("remark")}</Label>
        <Textarea
          id="remark"
          rows={3}
          value={form.remark}
          placeholder={t("remarkPlaceholder")}
          onChange={(event) => update({ remark: event.target.value })}
        />
      </div>

      <div className="space-y-3">
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {submitting ? t("submitting") : t("submit")}
        </Button>
        {result === "success" && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t("success")}</span>
            <Link
              href="/carpool-list"
              className="underline underline-offset-4 hover:text-emerald-300"
            >
              {t("viewTrips")}
            </Link>
          </div>
        )}
        {result === "fail" && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <XCircle className="h-4 w-4" />
            <span>{t("fail")}</span>
          </div>
        )}
      </div>
    </motion.form>
  );
}
