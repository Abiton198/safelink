import { useRef, useState } from "react";

type Props = {
    value: string; // "YYYY-MM-DD" or ""
    onChange: (iso: string) => void;
    required?: boolean;
};

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function toIso(d: string, m: string, y: string): string {
    if (!d || !m || y.length !== 4) return "";
    const day = Number(d), month = Number(m), year = Number(y);
    const date = new Date(year, month - 1, day);
    const valid =
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day &&
        year >= 1900 &&
        date <= new Date();
    if (!valid) return "";
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DateOfBirthInput({ value, onChange, required }: Props) {
    const [y0, m0, d0] = value ? value.split("-") : ["", "", ""];
    const [day, setDay] = useState(d0 ? String(Number(d0)) : "");
    const [month, setMonth] = useState(m0 ? String(Number(m0)) : "");
    const [year, setYear] = useState(y0 ?? "");

    const monthRef = useRef<HTMLSelectElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);

    const complete = day && month && year.length === 4;
    const invalid = complete && !toIso(day, month, year);

    const update = (d: string, m: string, y: string) => {
        setDay(d);
        setMonth(m);
        setYear(y);
        onChange(toIso(d, m, y));
    };

    return (
        <div>
            <div style={{ display: "flex", gap: 8 }}>
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder="DD"
                    aria-label="Day"
                    maxLength={2}
                    required={required}
                    value={day}
                    style={{ width: 64 }}
                    onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, "").slice(0, 2);
                        update(d, month, year);
                        // jump ahead when the day is complete (2 digits, or 4-9 which can't start a 2-digit day)
                        if (d.length === 2 || Number(d) > 3) monthRef.current?.focus();
                    }}
                />

                <select
                    aria-label="Month"
                    required={required}
                    value={month}
                    ref={monthRef}
                    style={{ flex: 1 }}
                    onChange={(e) => {
                        update(day, e.target.value, year);
                        yearRef.current?.focus();
                    }}
                >
                    <option value="">Month</option>
                    {MONTHS.map((name, i) => (
                        <option key={name} value={String(i + 1)}>
                            {name}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    inputMode="numeric"
                    placeholder="YYYY"
                    aria-label="Year"
                    maxLength={4}
                    required={required}
                    value={year}
                    ref={yearRef}
                    style={{ width: 80 }}
                    onChange={(e) =>
                        update(day, month, e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                />
            </div>

            {invalid && (
                <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 4 }}>
                    Please enter a valid date of birth.
                </p>
            )}
        </div>
    );
}