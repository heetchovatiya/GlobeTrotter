from datetime import date, timedelta


def split_trip_dates_for_stops(
    start_date: date, end_date: date, stop_count: int
) -> list[dict[str, date]]:
    if stop_count <= 1:
        return [{"arrival_date": start_date, "departure_date": end_date}]
    total_days = (end_date - start_date).days + 1
    segment_days = max(1, total_days // stop_count)
    segments: list[dict[str, date]] = []
    cursor = start_date
    for i in range(stop_count):
        is_last = i == stop_count - 1
        seg_end = end_date if is_last else cursor + timedelta(days=segment_days - 1)
        segments.append({"arrival_date": cursor, "departure_date": seg_end})
        cursor = seg_end + timedelta(days=1)
    return segments
