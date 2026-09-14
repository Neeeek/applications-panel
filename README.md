# Panel wniosków — tabela sterowana metadanymi

## Uruchomienie

```bash
npm install
npm run dev
```

Skrypty:
- `npm run dev` — serwer deweloperski
- `npm run typecheck` — sprawdzenie typów (`tsc -b`)
- `npm run test` — testy jednostkowe i komponentowe (Vitest + React Testing Library)

## Model metadanych

Kolumny (`data/columns.json`) opisują `key`, `label`, `type`
(`text | badge | currency | date | action`), `sortable`, `filterable`,
opcjonalnie `options` (np. lista statusów) i `action` (nazwa akcji wiersza).
Kolejność w tablicy JSON wyznacza kolejność kolumn; opcjonalne pola `order`
i `visible` (domyślnie `true`) pozwalają nadpisać kolejność/widoczność bez
zmiany kodu, gdyby metadane w przyszłości je zawierały.

**Założenie dot. kształtu danych:** kolumna `canEdit` ma `type: "action"`,
ale wiersze przechowują tę flagę zagnieżdżoną w `row.permissions.canEdit`,
a nie na najwyższym poziomie. Przyjęta konwencja: dla kolumn typu `action`
dostępność akcji jest odczytywana z `row.permissions[column.key]` — patrz
`src/components/ApplicationsTable/actionAvailability.ts`:

```ts
export function isActionAvailable(row: ApplicationRow, columnKey: string): boolean {
  return row.permissions?.[columnKey] === true;
}
```

## Decyzje techniczne

- **TanStack Table (headless)** do modelu kolumn/sortowania/filtrowania —
  biblioteka bez narzuconego UI, więc cała warstwa wizualna pozostaje
  w naszej gestii i proporcjonalna do zakresu zadania.
- **Tailwind CSS** (utility-first) dla stylów — klasy narzędziowe kolokowane
  z komponentami zamiast globalnego arkusza reguł.
- Brak realnego backendu — `src/api/applicationsAdapter.ts` symuluje
  żądanie (opóźnienie + tryb `success | empty | error` sterowany
  przełącznikiem w toolbarze), żeby stany `loading/success/empty/error`
  były deterministyczne i łatwe do przetestowania.

## Zasady programowania

- **Open/Closed Principle** — dodanie nowego typu wartości kolumny wymaga
  tylko nowego wpisu w rejestrze `src/components/ApplicationsTable/cellRenderers.tsx`, bez zmian
  w `ApplicationsTable` czy `columns.ts` (kod z `renderCell`):

  ```ts
  export function renderCell(props: CellRendererProps): ReactNode {
    const { row, column } = props;
    switch (column.type) {
      case "date":
        return renderDate(row, column);
      case "currency":
        return renderCurrency(row, column);
      case "badge":
        return renderBadge(row, column);
      case "action":
        return renderAction(props);
      case "text":
      default:
        return renderText(row, column);
    }
  }
  ```

- **Obrona przed brakującymi danymi (defensive design)** — komparatory
  sortowania (`src/components/ApplicationsTable/sorting.ts`) zawsze umieszczają `null`/`undefined`
  na końcu, niezależnie od kierunku sortowania, mimo że bieżące dane
  (`data/rows.json`) nie zawierają braków — bo metadane, nie stan
  bieżących danych, są źródłem prawdy o kontrakcie:

  ```ts
  function compareWithNullsLast<T>(
    a: T | null | undefined,
    b: T | null | undefined,
    compare: (a: T, b: T) => number
  ): number {
    const aMissing = a === null || a === undefined;
    const bMissing = b === null || b === undefined;
    if (aMissing && bMissing) return 0;
    if (aMissing) return 1;
    if (bMissing) return -1;
    return compare(a, b);
  }
  ```

## Co zrobił bym dalej przy dodatkowych 60-90 minutach

- Prawdziwy formularz edycji za akcją `edit` (obecnie zaślepka `window.alert`).
- Paginacja lub wirtualizacja wierszy — obecnie renderujemy wszystkie 1200
  wierszy naraz, co działa, ale nie skaluje się do dziesiątek tysięcy.
- Test integracyjny E2E (np. Playwright) pokrywający pełny przepływ
  filtrowania + sortowania + akcji na żywej stronie.
- Więcej testów brzegowych dla `columns.ts` (np. kolumna bez `options`
  przy próbie filtrowania).
