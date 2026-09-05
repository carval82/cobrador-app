import 'package:intl/intl.dart';

final _cop = NumberFormat.currency(
  locale: 'es_CO',
  symbol: r'$',
  decimalDigits: 0,
);

String money(num? value) => _cop.format(value ?? 0);

String initials(String? name) {
  final parts = (name ?? '').trim().split(RegExp(r'\s+'));
  if (parts.isEmpty || parts.first.isEmpty) return '?';
  if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
  return (parts.first[0] + parts.last[0]).toUpperCase();
}

const monthNames = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const monthShort = [
  '',
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

String monthLabel(int? month, int? year) {
  if (month == null || year == null) return '';
  return '${monthNames[month.clamp(1, 12)]} $year';
}

String firstInvoiceHint(DateTime date) {
  var first = DateTime(date.year, date.month + 1, 1);
  if (date.day > 15) {
    first = DateTime(first.year, first.month + 1, 1);
  }
  return monthLabel(first.month, first.year);
}

String offlineId(String prefix) {
  return '${prefix}_${DateTime.now().millisecondsSinceEpoch}';
}
