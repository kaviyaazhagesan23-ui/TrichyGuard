
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"

FILES = {
    "risk": DATA_DIR / "accident_risk_dataset.csv",
    "zone": DATA_DIR / "accident_zone_dataset.csv",
}




def inspect_dataset(name, path):
    print(f"\n{'=' * 55}")
    print(f"{name.upper()} DATASET")
    print("=" * 55)

    if not path.exists():
        print(f"ERROR: File not found: {path}")
        return

    df = pd.read_csv(path)

    print(f"Rows: {len(df)}")
    print(f"Columns: {len(df.columns)}")
    print("\nColumn names:")
    print(df.columns.tolist())

    print("\nData types:")
    print(df.dtypes)

    print("\nMissing values:")
    print(df.isnull().sum())

    print(f"\nDuplicate rows: {df.duplicated().sum()}")

    if name == "risk":
        if "accident_occurred" in df.columns:
            print("\nAccident target distribution:")
            print(df["accident_occurred"].value_counts(dropna=False))
        if "date" in df.columns:
            dates = pd.to_datetime(df["date"], errors="coerce")
            print("\nDate range:")
            print(dates.min(), "to", dates.max())
            print("Invalid dates:", dates.isna().sum())

    if name == "zone":
        if "zone_id" in df.columns:
            print("\nZone distribution:")
            print(df["zone_id"].value_counts(dropna=False))

    print("\nPreview:")
    print(df.head())

zone = pd.read_csv(DATA_DIR / "accident_zone_dataset.csv")


zone = zone.drop_duplicates().reset_index(drop=True)

zone.to_csv(
    DATA_DIR / "accident_zone_dataset.csv",
    index=False
)

print("Duplicates removed. Rows:", len(zone))



for name, path in FILES.items():
    inspect_dataset(name, path)