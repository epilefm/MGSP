#!/usr/bin/env python3
# RPA_TaskManager.py
# Gerenciador de Tarefas RPA otimizado
# Requisitos: Python 3.10+, PyQt6
# -----------------------------------------------------------------------------

from __future__ import annotations

import sys
import os
import json
import csv
import subprocess
import threading
from pathlib import Path
from datetime import datetime, date, time, timedelta
from collections import deque
from typing import List, Dict, Any, Optional

from PyQt6.QtCore import Qt, QTimer, QSize, QTime, QThread, pyqtSignal, QObject, QEvent
from PyQt6.QtGui import QColor, QPalette, QFont, QIcon, QAction
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QFormLayout,
    QLineEdit, QPushButton, QTabWidget, QTableWidget, QTableWidgetItem,
    QHeaderView, QDialog, QLabel, QComboBox, QSpinBox, QFileDialog,
    QMessageBox, QCheckBox, QTimeEdit, QGridLayout, QStatusBar,
    QAbstractItemView, QSizePolicy, QProgressBar, QSystemTrayIcon, QMenu
)

# -----------------------
# Configurações de arquivo
# -----------------------
DATA_FILE = "rpa_activities.json"
LOG_FILE = "rpa_logs.json"


# -----------------------
# Utilitários
# -----------------------
def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def ensure_dir_for_file(path: str):
    p = Path(path)
    if not p.parent.exists():
        p.parent.mkdir(parents=True, exist_ok=True)


def parse_time_str(s: str) -> Optional[time]:
    if not s:
        return None
    try:
        hh, mm = map(int, s.split(":")[:2])
        return time(hour=hh, minute=mm)
    except Exception:
        return None


def minutes_since_reference(current: time, start: time) -> int:
    cur_m = current.hour * 60 + current.minute
    sta_m = start.hour * 60 + start.minute
    if cur_m >= sta_m:
        return cur_m - sta_m
    return (24 * 60 - sta_m) + cur_m


def center_item(it: QTableWidgetItem):
    it.setTextAlignment(Qt.AlignmentFlag.AlignCenter)


def status_color(status: str) -> QColor:
    s = (status or "").lower()
    if s == "ativo":
        return QColor("#2ECC71")
    if s == "executando":
        return QColor("#F1C40F")
    return QColor("#E74C3C")


# -----------------------
# Worker Thread para execução
# -----------------------
class ExecutionThread(QThread):
    # Emite (activity_index or activity_name, result, message, duration_minutes)
    finished_signal = pyqtSignal(object, str, str, int)

    def __init__(self, activity: Dict[str, Any]):
        super().__init__()
        self.activity = activity

    def run(self):
        name = self.activity.get("nome", "(sem nome)")
        path = self.activity.get("path", "")
        dur = int(self.activity.get("duracao_min", 1) or 1)
        try:
            if not path:
                raise FileNotFoundError("Nenhum caminho definido.")
            if os.name == "nt":
                os.startfile(path)  # type: ignore
            else:
                try:
                    subprocess.Popen(["xdg-open", path])
                except Exception:
                    subprocess.Popen([path])
            # sucesso
            self.msleep(200)  # curto delay para o app abrir (não bloqueante)
            self.finished_signal.emit(self.activity, "success", f"Executado com sucesso — estimado {dur} min.", dur)
        except Exception as e:
            self.finished_signal.emit(self.activity, "fail", str(e), dur)


# -----------------------
# Popup Detalhado com Filtros
# -----------------------
class DetailedPopup(QDialog):
    def __init__(self, parent: "RPA_TaskManager"):
        super().__init__(parent)
        self.parent = parent
        self.setWindowTitle("Visualização Detalhada - Atividades RPA")
        self.setWindowFlags(
            Qt.WindowType.Window | Qt.WindowType.WindowMaximizeButtonHint | Qt.WindowType.WindowCloseButtonHint)
        screen = QApplication.primaryScreen().availableGeometry()
        self.resize(int(screen.width() * 0.85), int(screen.height() * 0.85))
        self.init_ui()
        self.apply_style()
        self.refresh()

    def init_ui(self):
        layout = QVBoxLayout(self)
        filter_row = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Buscar por nome ou descrição...")
        self.search_input.textChanged.connect(self.on_filter_changed)
        self.chk_only_active = QCheckBox("Apenas Ativos")
        self.chk_only_active.setChecked(False)
        self.chk_only_active.stateChanged.connect(self.on_filter_changed)
        btn_refresh = QPushButton("Atualizar")
        btn_refresh.clicked.connect(self.refresh)
        filter_row.addWidget(self.search_input)
        filter_row.addWidget(self.chk_only_active)
        filter_row.addWidget(btn_refresh)
        layout.addLayout(filter_row)

        self.tbl = QTableWidget()
        self.tbl.setColumnCount(9)
        headers = ["Nome", "Descrição", "Caminho", "Horário", "Intervalo(min)", "Duração(min)", "Dias", "Status",
                   "Ações"]
        self.tbl.setHorizontalHeaderLabels(headers)
        self.tbl.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.tbl.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.tbl.setAlternatingRowColors(False)  # Remover listras alternadas
        self.tbl.cellDoubleClicked.connect(self.on_double)
        layout.addWidget(self.tbl, 1)

        btn_row = QHBoxLayout()
        self.btn_close = QPushButton("Fechar")
        self.btn_close.clicked.connect(self.close)
        btn_row.addStretch()
        btn_row.addWidget(self.btn_close)
        layout.addLayout(btn_row)

    def apply_style(self):
        self.setStyleSheet("""
            QDialog { 
                background-color: #1e1e1e; 
                color: #E8EAED; 
                font-family: 'Segoe UI', 'Arial', sans-serif;
            }
            QLineEdit, QComboBox, QSpinBox { 
                background-color: #303134; 
                color: #E8EAED; 
                padding: 10px; 
                border-radius: 6px;
                border: 1px solid #444;
                font-size: 10px;
            }
            QLineEdit:focus, QComboBox:focus, QSpinBox:focus {
                border: 1px solid #0078d7;
                outline: none;
                box-shadow: 0 0 0 2px rgba(0, 120, 215, 0.3);
            }
            QPushButton { 
                background-color: #0078d7; 
                color: #FFFFFF; 
                padding: 10px 16px; 
                border-radius: 6px; 
                transition: all 0.3s ease; 
                border: none;
                font-weight: 600;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            QPushButton:hover { 
                background-color: #0066b4; 
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            }
            QPushButton:pressed {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                background-color: #005a9e;
            }
            QPushButton:disabled {
                background-color: #3c3c3c;
                color: #777777;
                transform: none;
                box-shadow: none;
            }
            QTableWidget { 
                background: #303134; 
                color: #E8EAED; 
                border: 1px solid #3C4043;
                border-radius: 8px;
                gridline-color: #3C4043;
                selection-background-color: #0078d7;
                selection-color: #FFFFFF;
                alternate-background-color: #2d2d30;
            }
            QTableWidget::item { 
                background: #303134; 
                color: #E8EAED; 
            }
            QTableWidget::item:hover { 
                background: #3a3a3a; 
            }
            QHeaderView::section { 
                background: #3C4043; 
                color: #E8EAED; 
                padding: 10px 8px; 
                border: 1px solid #35383A;
                font-weight: 600;
                border-radius: 4px;
                font-size: 10px;
                text-transform: uppercase;
            }
            QTableCornerButton::section {
                background: #3C4043;
                border: 1px solid #35383A;
            }
        """)
        self.setFont(QFont("Segoe UI", 10))

    def on_filter_changed(self):
        self.refresh()

    def refresh(self):
        activities = self.parent.activities
        q = (self.search_input.text() or "").strip().lower()
        only_active = self.chk_only_active.isChecked()

        filtered = []
        for a in activities:
            if only_active and (a.get("status", "").lower() != "ativo"):
                continue
            combined = (a.get("nome", "") + " " + a.get("descricao", "")).lower()
            if q and q not in combined:
                continue
            filtered.append(a)

        self.tbl.setRowCount(len(filtered))
        for r, a in enumerate(filtered):
            it_name = QTableWidgetItem(a.get("nome", ""))
            it_desc = QTableWidgetItem(a.get("descricao", ""))
            it_path = QTableWidgetItem(a.get("path", ""))
            it_time = QTableWidgetItem(a.get("time_start", ""))
            it_interval = QTableWidgetItem(str(a.get("repete_a_cada_min", 0) or "—"))
            it_dur = QTableWidgetItem(str(a.get("duracao_min", 0)))
            days = ", ".join(str(d) for d in a.get("weekdays", []))
            it_days = QTableWidgetItem(days)
            it_status = QTableWidgetItem(a.get("status", "Inativo"))

            for it in (it_name, it_desc, it_path, it_time, it_interval, it_dur, it_days, it_status):
                center_item(it)

            it_status.setForeground(status_color(a.get("status", "")))
            self.tbl.setItem(r, 0, it_name)
            self.tbl.setItem(r, 1, it_desc)
            self.tbl.setItem(r, 2, it_path)
            self.tbl.setItem(r, 3, it_time)
            self.tbl.setItem(r, 4, it_interval)
            self.tbl.setItem(r, 5, it_dur)
            self.tbl.setItem(r, 6, it_days)
            self.tbl.setItem(r, 7, it_status)

            w = QWidget()
            lay = QHBoxLayout(w);
            lay.setContentsMargins(2, 2, 2, 2)
            btn_edit = QPushButton("✏️");
            btn_run = QPushButton("▶");
            btn_del = QPushButton("✕")
            btn_edit.setFixedSize(QSize(36, 28));
            btn_run.setFixedSize(QSize(36, 28));
            btn_del.setFixedSize(QSize(36, 28))
            try:
                idx = self.parent.activities.index(a)
            except ValueError:
                idx = -1
            if idx >= 0:
                btn_edit.clicked.connect(lambda _, ii=idx: self.parent.open_activity_popup(ii))
                btn_run.clicked.connect(lambda _, aa=a: self.parent.enqueue_or_execute(aa))
                btn_del.clicked.connect(lambda _, ii=idx: (self.parent.remove_activity(ii), self.refresh()))
            for b in (btn_edit, btn_run, btn_del):
                b.setCursor(Qt.CursorShape.PointingHandCursor)
            lay.addWidget(btn_edit);
            lay.addWidget(btn_run);
            lay.addWidget(btn_del);
            lay.addStretch()
            self.tbl.setCellWidget(r, 8, w)

        self.tbl.resizeRowsToContents()

    def on_double(self, row, col):
        self.refresh()
        item = self.tbl.item(row, 0)
        if item:
            name = item.text()
            for i, a in enumerate(self.parent.activities):
                if a.get("nome", "") == name:
                    self.parent.open_activity_popup(i)
                    break


# -----------------------
# Activity Popup (edit single) + popup-exec auto-close
# -----------------------
class ActivityPopup(QDialog):
    # Now modeless-friendly: will not block main thread (use show())
    def __init__(self, parent: "RPA_TaskManager", activity: Dict[str, Any], auto_close_ms: int = 3000):
        super().__init__(parent)
        self.parent = parent
        self.activity = activity
        self.auto_close_ms = auto_close_ms
        self.remaining_ms = auto_close_ms
        self.setWindowTitle(f"Executar / Editar — {activity.get('nome', '(sem nome)')}")
        self.setWindowFlags(
            Qt.WindowType.Window | Qt.WindowType.WindowMaximizeButtonHint | Qt.WindowType.WindowCloseButtonHint)
        screen = QApplication.primaryScreen().availableGeometry()
        self.resize(int(screen.width() * 0.6), int(screen.height() * 0.45))
        self.init_ui()
        self.apply_style()

        # UI timer for auto-close and progress
        self._ui_timer = QTimer(self)
        self._ui_timer.setInterval(100)  # 100 ms updates
        self._ui_timer.timeout.connect(self._tick)
        self._ui_timer.start()

    def init_ui(self):
        layout = QVBoxLayout(self)
        header = QLabel(self.activity.get("nome", "(sem nome)"))
        header.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        header.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(header)

        info = QLabel(
            f"Horário: {self.activity.get('time_start', '—')}   •   Duração estimada: {self.activity.get('duracao_min', 0)} min   •   Status: {self.activity.get('status', 'Inativo')}"
        )
        info.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(info)

        self.progress = QProgressBar()
        self.progress.setRange(0, max(1, self.auto_close_ms // 100))
        self.progress.setValue(0)
        self.progress.setTextVisible(True)
        self.progress.setFormat("Executando em %v/%m (auto)")
        layout.addWidget(self.progress)

        btn_row = QHBoxLayout()
        self.btn_run_now = QPushButton("Executar Agora")
        self.btn_run_now.clicked.connect(self._execute_now)
        self.btn_save = QPushButton("Salvar")
        self.btn_save.clicked.connect(self._save_and_close)
        self.btn_cancel = QPushButton("Cancelar")
        self.btn_cancel.clicked.connect(self._close_and_stop)
        for b in (self.btn_run_now, self.btn_save, self.btn_cancel):
            b.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_row.addStretch();
        btn_row.addWidget(self.btn_run_now);
        btn_row.addWidget(self.btn_save);
        btn_row.addWidget(self.btn_cancel)
        layout.addLayout(btn_row)

        hint = QLabel(
            "Popup fecha automaticamente (auto-executa) após o tempo acima — clique em Executar Agora para forçar.")
        hint.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(hint)

    def apply_style(self):
        self.setStyleSheet("""
            QDialog { 
                background-color: #1e1e1e; 
                color: #E8EAED; 
                font-family: 'Segoe UI', 'Arial', sans-serif;
            }
            QLabel { 
                color: #E8EAED; 
                font-size: 11px;
            }
            QProgressBar { 
                background-color: #303134; 
                color: #E8EAED; 
                height: 24px; 
                border-radius: 6px; 
                text-align: center;
                border: 1px solid #3C4043;
            }
            QProgressBar::chunk {
                background-color: #0078d7;
                border-radius: 5px;
            }
            QPushButton { 
                background-color: #0078d7; 
                color: #FFFFFF; 
                padding: 10px 16px; 
                border-radius: 6px; 
                transition: all 0.3s ease; 
                border: none;
                font-weight: 600;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            QPushButton:hover { 
                background-color: #0066b4; 
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            }
            QPushButton:pressed {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                background-color: #005a9e;
            }
            QPushButton:disabled {
                background-color: #3c3c3c;
                color: #777777;
                transform: none;
                box-shadow: none;
            }
        """)
        self.setFont(QFont("Segoe UI", 10))

    def _tick(self):
        self.remaining_ms -= 100
        if self.remaining_ms <= 0:
            self._ui_timer.stop()
            # Use parent's async executor (threaded)
            self.parent.execute_activity_now(self.activity)
            self.close()
            return
        total_steps = max(1, self.auto_close_ms // 100)
        steps_done = (self.auto_close_ms - self.remaining_ms) // 100
        self.progress.setRange(0, total_steps)
        self.progress.setValue(steps_done)

    def _execute_now(self):
        if self._ui_timer.isActive():
            self._ui_timer.stop()
        self.parent.execute_activity_now(self.activity)
        self.close()

    def _save_and_close(self):
        dlg = EditActivityPopup(self.parent, self.activity)
        if dlg.exec():
            self.parent.save_activities()
            self.parent.refresh_table()
        self.close()

    def _close_and_stop(self):
        # Stops the auto-close timer and closes popup
        if self._ui_timer.isActive():
            self._ui_timer.stop()
        self.close()


# -----------------------
# Edit Activity Popup (full editor)
# -----------------------
class EditActivityPopup(QDialog):
    def __init__(self, parent: "RPA_TaskManager", activity: Dict[str, Any]):
        super().__init__(parent)
        self.parent = parent
        self.activity = activity
        self.setWindowTitle(f"Editar Atividade RPA — {activity.get('nome', '(sem nome)')}")
        self.setWindowFlags(
            Qt.WindowType.Window | Qt.WindowType.WindowMaximizeButtonHint | Qt.WindowType.WindowCloseButtonHint)
        screen = QApplication.primaryScreen().availableGeometry()
        self.resize(int(screen.width() * 0.75), int(screen.height() * 0.7))
        self.init_ui()
        self.apply_style()

    def init_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(10)
        layout.setContentsMargins(15, 15, 15, 15)

        # Título
        title = QLabel(f"Editar Atividade RPA — {self.activity.get('nome', '(sem nome)')}")
        title.setStyleSheet("""
            QLabel {
                color: #E8EAED;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 10px;
            }
        """)
        layout.addWidget(title)

        # Formulário
        form = QGridLayout()
        form.setHorizontalSpacing(15)
        form.setVerticalSpacing(12)
        form.setContentsMargins(0, 0, 0, 0)

        # Ajustar tamanho das labels
        label_style = "QLabel { font-size: 11px; font-weight: 500; color: #E8EAED; }"

        # Nome
        name_label = QLabel("Nome:")
        name_label.setStyleSheet(label_style)
        form.addWidget(name_label, 0, 0)
        self.edt_nome = QLineEdit(self.activity.get("nome", ""))
        self.edt_nome.setStyleSheet("""
            QLineEdit {
                padding: 8px;
                font-size: 11px;
                border-radius: 5px;
            }
        """)
        form.addWidget(self.edt_nome, 0, 1)

        # Descrição
        desc_label = QLabel("Descrição:")
        desc_label.setStyleSheet(label_style)
        form.addWidget(desc_label, 1, 0)
        self.edt_desc = QLineEdit(self.activity.get("descricao", ""))
        self.edt_desc.setStyleSheet("""
            QLineEdit {
                padding: 8px;
                font-size: 11px;
                border-radius: 5px;
            }
        """)
        form.addWidget(self.edt_desc, 1, 1)

        # Caminho
        path_label = QLabel("Caminho:")
        path_label.setStyleSheet(label_style)
        form.addWidget(path_label, 2, 0)
        path_row = QHBoxLayout()
        path_row.setSpacing(8)
        self.edt_path = QLineEdit(self.activity.get("path", ""))
        self.edt_path.setStyleSheet("""
            QLineEdit {
                padding: 8px;
                font-size: 11px;
                border-radius: 5px;
            }
        """)
        btn_browse = QPushButton("Procurar")
        btn_browse.setStyleSheet("""
            QPushButton {
                padding: 6px 12px;
                font-size: 11px;
                border-radius: 5px;
            }
        """)
        btn_browse.clicked.connect(self.browse_file)
        path_row.addWidget(self.edt_path)
        path_row.addWidget(btn_browse)
        form.addLayout(path_row, 2, 1)

        # Status
        status_label = QLabel("Status:")
        status_label.setStyleSheet(label_style)
        form.addWidget(status_label, 3, 0)
        self.cmb_status = QComboBox()
        self.cmb_status.addItems(["Ativo", "Inativo"])
        self.cmb_status.setStyleSheet("""
            QComboBox {
                padding: 8px;
                font-size: 11px;
                border-radius: 5px;
            }
            QComboBox::drop-down {
                border-radius: 5px;
            }
        """)
        idx = 0 if (self.activity.get("status", "").lower() == "ativo") else 1
        self.cmb_status.setCurrentIndex(idx)
        form.addWidget(self.cmb_status, 3, 1)

        # Duração
        dur_label = QLabel("Duração (min):")
        dur_label.setStyleSheet(label_style)
        form.addWidget(dur_label, 4, 0)
        self.spin_dur = QSpinBox()
        self.spin_dur.setRange(1, 24 * 60)
        self.spin_dur.setValue(int(self.activity.get("duracao_min", 5)))
        self.spin_dur.setStyleSheet("""
            QSpinBox {
                padding: 8px;
                font-size: 11px;
                border-radius: 5px;
            }
        """)
        form.addWidget(self.spin_dur, 4, 1)

        # Repetir a cada
        every_label = QLabel("Repetir a cada (min):")
        every_label.setStyleSheet(label_style)
        form.addWidget(every_label, 5, 0)
        self.spin_every = QSpinBox()
        self.spin_every.setRange(0, 24 * 60)
        self.spin_every.setValue(int(self.activity.get("repete_a_cada_min", 0)))
        self.spin_every.setStyleSheet("""
            QSpinBox {
                padding: 8px;
                font-size: 11px;
                border-radius: 5px;
            }
        """)
        form.addWidget(self.spin_every, 5, 1)

        # Iniciar às
        start_label = QLabel("Iniciar às:")
        start_label.setStyleSheet(label_style)
        form.addWidget(start_label, 6, 0)
        self.time_start = QTimeEdit()
        self.time_start.setDisplayFormat("HH:mm")
        self.time_start.setStyleSheet("""
            QTimeEdit {
                padding: 8px;
                font-size: 11px;
                border-radius: 5px;
            }
        """)
        ts = parse_time_str(self.activity.get("time_start", ""))
        if ts:
            qt = QTime.fromString(ts.strftime("%H:%M"), "HH:mm")
            if qt.isValid():
                self.time_start.setTime(qt)
        form.addWidget(self.time_start, 6, 1)

        # Parar às
        stop_label = QLabel("Parar às:")
        stop_label.setStyleSheet(label_style)
        form.addWidget(stop_label, 7, 0)
        self.time_stop = QTimeEdit()
        self.time_stop.setDisplayFormat("HH:mm")
        self.time_stop.setStyleSheet("""
            QTimeEdit {
                padding: 8px;
                font-size: 11px;
                border-radius: 5px;
            }
        """)
        tstop = parse_time_str(self.activity.get("time_stop", ""))
        if tstop:
            qt2 = QTime.fromString(tstop.strftime("%H:%M"), "HH:mm")
            if qt2.isValid():
                self.time_stop.setTime(qt2)
        form.addWidget(self.time_stop, 7, 1)

        # Dias
        days_label = QLabel("Dias:")
        days_label.setStyleSheet(label_style)
        form.addWidget(days_label, 8, 0)
        days_h = QHBoxLayout()
        days_h.setSpacing(8)
        self.chk_mon = QCheckBox("Seg")
        self.chk_tue = QCheckBox("Ter")
        self.chk_wed = QCheckBox("Qua")
        self.chk_thu = QCheckBox("Qui")
        self.chk_fri = QCheckBox("Sex")
        self.chk_sat = QCheckBox("Sáb")
        self.chk_sun = QCheckBox("Dom")
        # Ajustar tamanho dos checkboxes
        for c in (self.chk_mon, self.chk_tue, self.chk_wed, self.chk_thu, self.chk_fri, self.chk_sat, self.chk_sun):
            c.setStyleSheet("""
                QCheckBox {
                    spacing: 5px;
                    font-size: 11px;
                }
                QCheckBox::indicator {
                    width: 18px;
                    height: 18px;
                }
            """)
            days_h.addWidget(c)
        wk = self.activity.get("weekdays", [])
        for idx, chk in enumerate(
                (self.chk_mon, self.chk_tue, self.chk_wed, self.chk_thu, self.chk_fri, self.chk_sat, self.chk_sun)):
            if idx in wk:
                chk.setChecked(True)
        form.addLayout(days_h, 8, 1)

        layout.addLayout(form)
        layout.addStretch()

        # Botões
        row = QHBoxLayout()
        row.setSpacing(10)
        self.btn_exec = QPushButton("Executar Agora")
        self.btn_save = QPushButton("Salvar")
        self.btn_cancel = QPushButton("Cancelar")
        self.btn_exec.setStyleSheet("""
            QPushButton {
                padding: 8px 16px;
                font-size: 11px;
                font-weight: 600;
                border-radius: 6px;
            }
        """)
        self.btn_save.setStyleSheet("""
            QPushButton {
                padding: 8px 16px;
                font-size: 11px;
                font-weight: 600;
                border-radius: 6px;
            }
        """)
        self.btn_cancel.setStyleSheet("""
            QPushButton {
                padding: 8px 16px;
                font-size: 11px;
                font-weight: 600;
                border-radius: 6px;
            }
        """)
        self.btn_exec.clicked.connect(self.on_exec)
        self.btn_save.clicked.connect(self.on_save)
        self.btn_cancel.clicked.connect(self.reject)
        row.addStretch()
        row.addWidget(self.btn_exec)
        row.addWidget(self.btn_save)
        row.addWidget(self.btn_cancel)
        layout.addLayout(row)

    def apply_style(self):
        self.setStyleSheet("""
            QDialog { 
                background-color: #1e1e1e; 
                color: #E8EAED; 
                font-family: 'Segoe UI', 'Arial', sans-serif;
            }
            QLabel { 
                color: #E8EAED; 
                font-size: 11px;
                font-weight: 500;
            }
            QLineEdit, QComboBox, QSpinBox, QTimeEdit { 
                background-color: #303134; 
                color: #E8EAED; 
                padding: 8px; 
                border-radius: 5px;
                border: 1px solid #444;
                font-size: 11px;
            }
            QLineEdit:focus, QComboBox:focus, QSpinBox:focus, QTimeEdit:focus {
                border: 1px solid #0078d7;
                outline: none;
                box-shadow: 0 0 0 2px rgba(0, 120, 215, 0.3);
            }
            QPushButton { 
                background-color: #0078d7; 
                color: #FFFFFF; 
                padding: 8px 16px; 
                border-radius: 6px; 
                transition: all 0.3s ease; 
                border: none;
                font-weight: 600;
                font-size: 11px;
            }
            QPushButton:hover { 
                background-color: #0066b4; 
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            }
            QPushButton:pressed {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                background-color: #005a9e;
            }
            QPushButton:disabled {
                background-color: #3c3c3c;
                color: #777777;
                transform: none;
                box-shadow: none;
            }
        """)
        self.setFont(QFont("Segoe UI", 10))

    def browse_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Selecionar arquivo", "", "Todos os arquivos (*.*)")
        if path:
            self.edt_path.setText(path)

    def on_save(self):
        name = self.edt_nome.text().strip()
        if not name:
            QMessageBox.warning(self, "Aviso", "Nome obrigatório.")
            return
        self.activity["nome"] = name
        self.activity["descricao"] = self.edt_desc.text().strip()
        self.activity["path"] = self.edt_path.text().strip()
        self.activity["status"] = self.cmb_status.currentText()
        self.activity["duracao_min"] = int(self.spin_dur.value())
        self.activity["repete_a_cada_min"] = int(self.spin_every.value())
        self.activity["time_start"] = self.time_start.time().toString("HH:mm")
        self.activity["time_stop"] = self.time_stop.time().toString("HH:mm")
        wk = []
        if self.chk_mon.isChecked(): wk.append(0)
        if self.chk_tue.isChecked(): wk.append(1)
        if self.chk_wed.isChecked(): wk.append(2)
        if self.chk_thu.isChecked(): wk.append(3)
        if self.chk_fri.isChecked(): wk.append(4)
        if self.chk_sat.isChecked(): wk.append(5)
        if self.chk_sun.isChecked(): wk.append(6)
        self.activity["weekdays"] = wk
        self.parent.save_activities()
        self.parent.refresh_table()
        self.accept()

    def on_exec(self):
        self.parent.enqueue_or_execute(self.activity)
        QMessageBox.information(self, "Agendado/Executando",
                                f"'{self.activity.get('nome')}' foi solicitado para execução.")


# -----------------------
# Janela Principal - Gerenciador de Tarefas RPA
# -----------------------
class RPA_TaskManager(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Gerenciador de Tarefas RPA - Otimizado")
        self.resize(1280, 900)
        self.activities: List[Dict[str, Any]] = []
        self.logs: List[Dict[str, Any]] = []
        self.queue: deque = deque()  # fila FIFO de atividades a executar
        self.busy_until: Optional[datetime] = None

        # queue control
        self.queue_paused: bool = False

        # notification settings
        self.enable_notifications: bool = True

        # System tray icon
        self.tray_icon = None
        self.create_tray_icon()

    def closeEvent(self, event):
        # Minimizar para a bandeja em vez de fechar
        if self.tray_icon and self.tray_icon.isVisible():
            self.hide()
            event.ignore()
            # Mostrar mensagem informativa
            self.tray_icon.showMessage(
                "Gerenciador de Tarefas RPA",
                "A aplicação continua rodando em segundo plano. Clique no ícone para mostrar/ocultar.",
                QSystemTrayIcon.MessageIcon.Information,
                2000
            )
        else:
            event.accept()

    def create_tray_icon(self):
        if not QSystemTrayIcon.isSystemTrayAvailable():
            return

        # Criar um pixmap para o ícone
        pixmap = QPixmap(64, 64)
        pixmap.fill(Qt.GlobalColor.transparent)
        
        # Criar um painter para desenhar no pixmap
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Desenhar um fundo azul escuro
        painter.setBrush(QColor("#0078d7"))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRoundedRect(0, 0, 64, 64, 10, 10)
        
        # Desenhar um símbolo de play branco
        painter.setBrush(Qt.GlobalColor.white)
        painter.drawPolygon([
            pixmap.rect().topLeft() + QPoint(20, 15),
            pixmap.rect().topLeft() + QPoint(20, 49),
            pixmap.rect().topLeft() + QPoint(45, 32)
        ])
        
        painter.end()
        
        # Criar o ícone da bandeja
        self.tray_icon = QSystemTrayIcon(self)
        self.tray_icon.setIcon(QIcon(pixmap))

        # Criar o menu de contexto
        tray_menu = QMenu()
        
        # Ação para mostrar/ocultar a janela
        show_action = QAction("Mostrar/Ocultar", self)
        show_action.triggered.connect(self.toggle_window_visibility)
        tray_menu.addAction(show_action)
        
        # Ação para pausar/retomar a fila
        self.pause_action = QAction("Pausar Fila", self)
        self.pause_action.triggered.connect(self.toggle_queue_pause_from_tray)
        tray_menu.addAction(self.pause_action)
        
        # Ação para sair
        quit_action = QAction("Sair", self)
        quit_action.triggered.connect(self.quit_application)
        tray_menu.addAction(quit_action)
        
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.on_tray_icon_activated)
        self.tray_icon.show()

        # timers
        self.scheduler_timer = QTimer(self)
        self.scheduler_timer.timeout.connect(self.check_schedules_tick)
        self.scheduler_timer.start(60_000)  # a cada minuto

        self.status_timer = QTimer(self)
        self.status_timer.timeout.connect(self.update_status_bar)
        self.status_timer.start(1000)  # atualiza contador a cada segundo

        # carregar dados
        self.load_activities()
        self.load_logs()

        # construir UI
        self.init_ui()
        self.apply_theme()
        self.refresh_table()
        self.refresh_logs_table()
        self.update_status_bar()

        # threads registry to avoid GC while running
        self._active_threads: List[ExecutionThread] = []

    def toggle_window_visibility(self):
        if self.isVisible():
            self.hide()
        else:
            self.show()
            self.raise_()
            self.activateWindow()

    def toggle_queue_pause_from_tray(self):
        self.queue_paused = not self.queue_paused
        if self.queue_paused:
            self.pause_action.setText("Retomar Fila")
            self.btn_pause_queue.setText("Fila Pausada")
            self.btn_pause_queue.setChecked(True)
        else:
            self.pause_action.setText("Pausar Fila")
            self.btn_pause_queue.setText("Pausar Fila")
            self.btn_pause_queue.setChecked(False)
            # if resumed and queue has jobs, start them (respecting parallel limit)
            if self.queue:
                QTimer.singleShot(200, lambda: self.enqueue_or_execute(self.queue.popleft()))

    def quit_application(self):
        # Fechar a aplicação completamente
        QApplication.quit()

    def on_tray_icon_activated(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.Trigger:
            # Clique simples no ícone da bandeja
            self.toggle_window_visibility()

    def init_ui(self):
        central = QWidget()
        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(8, 8, 8, 8)
        main_layout.setSpacing(10)

        # Top row: quick actions, open detailed popup
        top = QHBoxLayout()
        self.chk_notifications = QCheckBox("Habilitar Notificações")
        self.chk_notifications.setChecked(self.enable_notifications)
        self.chk_notifications.stateChanged.connect(self.on_notifications_changed)
        btn_detailed = QPushButton("Visualização Detalhada")
        btn_detailed.clicked.connect(self.open_detailed_popup)
        btn_export = QPushButton("Exportar Atividades (CSV)")
        btn_export.clicked.connect(self.export_activities_csv)
        top.addWidget(self.chk_notifications)
        top.addStretch()
        top.addWidget(btn_detailed)
        top.addWidget(btn_export)
        main_layout.addLayout(top)

        # Tabs: create / list / logs
        self.tabs = QTabWidget()
        self.tab_create = QWidget();
        self.tab_list = QWidget();
        self.tab_logs = QWidget()
        self.tabs.addTab(self.tab_create, "Criar Atividade")
        self.tabs.addTab(self.tab_list, "Atividades Registradas")
        self.tabs.addTab(self.tab_logs, "Logs")
        main_layout.addWidget(self.tabs, 1)

        # build create tab
        self.build_create_tab()
        # build list tab
        self.build_list_tab()
        # build logs tab
        self.build_logs_tab()

        # status bar with busy indicator + queue indicator + controls
        self.statusbar = QStatusBar()
        self.setStatusBar(self.statusbar)
        self.busy_label = QLabel("Disponível ✅")
        self.queue_label = QLabel("Fila: 0")
        # pause/resume queue button
        self.btn_pause_queue = QPushButton("Pausar Fila")
        self.btn_pause_queue.setCheckable(True)
        self.btn_pause_queue.clicked.connect(self.toggle_pause_queue)
        # Aumentar o tamanho da fonte dos labels e botão da barra de status
        self.queue_label.setStyleSheet("font-size: 12px; font-weight: bold;")
        self.busy_label.setStyleSheet("font-size: 12px; font-weight: bold;")
        self.btn_pause_queue.setStyleSheet("font-size: 12px; font-weight: bold; padding: 5px 10px;")
        
        self.statusbar.addPermanentWidget(self.queue_label)
        self.statusbar.addPermanentWidget(self.busy_label)
        self.statusbar.addPermanentWidget(self.btn_pause_queue)

        self.setCentralWidget(central)

    def build_create_tab(self):
        layout = QFormLayout()
        layout.setLabelAlignment(Qt.AlignmentFlag.AlignRight)
        layout.setHorizontalSpacing(15)
        layout.setVerticalSpacing(10)

        self.in_name = QLineEdit()
        self.in_name.setStyleSheet("""
            QLineEdit {
                padding: 10px;
                font-size: 12px;
                border-radius: 6px;
            }
        """)
        self.in_desc = QLineEdit()
        self.in_desc.setStyleSheet("""
            QLineEdit {
                padding: 10px;
                font-size: 12px;
                border-radius: 6px;
            }
        """)
        self.in_path = QLineEdit()
        self.in_path.setStyleSheet("""
            QLineEdit {
                padding: 10px;
                font-size: 12px;
                border-radius: 6px;
            }
        """)
        btn_browse = QPushButton("Procurar")
        btn_browse.setStyleSheet("""
            QPushButton {
                padding: 8px 16px;
                font-size: 12px;
                border-radius: 6px;
            }
        """)
        btn_browse.clicked.connect(self.browse_file_create)
        self.in_status = QComboBox()
        self.in_status.addItems(["Ativo", "Inativo", "Pausado"])
        self.in_status.setStyleSheet("""
            QComboBox {
                padding: 10px;
                font-size: 12px;
                border-radius: 6px;
            }
            QComboBox::drop-down {
                border-radius: 6px;
            }
        """)
        self.in_duration = QSpinBox()
        self.in_duration.setRange(1, 24 * 60)
        self.in_duration.setValue(5)
        self.in_duration.setStyleSheet("""
            QSpinBox {
                padding: 10px;
                font-size: 12px;
                border-radius: 6px;
            }
        """)
        self.in_every = QSpinBox()
        self.in_every.setRange(0, 24 * 60)
        self.in_every.setValue(0)
        self.in_every.setStyleSheet("""
            QSpinBox {
                padding: 10px;
                font-size: 12px;
                border-radius: 6px;
            }
        """)
        self.in_time_start = QTimeEdit()
        self.in_time_start.setDisplayFormat("HH:mm")
        self.in_time_start.setStyleSheet("""
            QTimeEdit {
                padding: 10px;
                font-size: 12px;
                border-radius: 6px;
            }
        """)
        self.in_time_stop = QTimeEdit()
        self.in_time_stop.setDisplayFormat("HH:mm")
        self.in_time_stop.setStyleSheet("""
            QTimeEdit {
                padding: 10px;
                font-size: 12px;
                border-radius: 6px;
            }
        """)
        days_w = QWidget()
        days_layout = QHBoxLayout(days_w)
        days_layout.setSpacing(15)
        self.c_mon = QCheckBox("Seg")
        self.c_tue = QCheckBox("Ter")
        self.c_wed = QCheckBox("Qua")
        self.c_thu = QCheckBox("Qui")
        self.c_fri = QCheckBox("Sex")
        self.c_sat = QCheckBox("Sáb")
        self.c_sun = QCheckBox("Dom")
        # Ajustar tamanho dos checkboxes
        for c in (self.c_mon, self.c_tue, self.c_wed, self.c_thu, self.c_fri, self.c_sat, self.c_sun):
            c.setStyleSheet("""
                QCheckBox {
                    spacing: 8px;
                    font-size: 12px;
                    padding: 10px;
                    border-radius: 6px;
                    background-color: #303134;
                }
                QCheckBox::indicator {
                    width: 20px;
                    height: 20px;
                }
                QCheckBox:hover {
                    background-color: #3a3a3a;
                }
            """)
            days_layout.addWidget(c)

        # Ajustar tamanho das labels
        label_style = "QLabel { font-size: 12px; font-weight: 500; }"

        name_label = QLabel("Nome:")
        name_label.setStyleSheet(label_style)
        layout.addRow(name_label, self.in_name)

        desc_label = QLabel("Descrição:")
        desc_label.setStyleSheet(label_style)
        layout.addRow(desc_label, self.in_desc)

        path_label = QLabel("Caminho:")
        path_label.setStyleSheet(label_style)
        ph = QHBoxLayout()
        ph.addWidget(self.in_path)
        ph.addWidget(btn_browse)
        layout.addRow(path_label, ph)

        status_label = QLabel("Status:")
        status_label.setStyleSheet(label_style)
        layout.addRow(status_label, self.in_status)

        duration_label = QLabel("Duração estimada (min):")
        duration_label.setStyleSheet(label_style)
        layout.addRow(duration_label, self.in_duration)

        every_label = QLabel("Repetir a cada (min):")
        every_label.setStyleSheet(label_style)
        layout.addRow(every_label, self.in_every)

        start_label = QLabel("Iniciar às:")
        start_label.setStyleSheet(label_style)
        layout.addRow(start_label, self.in_time_start)

        stop_label = QLabel("Parar às:")
        stop_label.setStyleSheet(label_style)
        layout.addRow(stop_label, self.in_time_stop)

        days_label = QLabel("Dias:")
        days_label.setStyleSheet(label_style)
        layout.addRow(days_label, days_w)

        btn_save = QPushButton("Salvar Atividade")
        btn_save.setStyleSheet("""
            QPushButton {
                padding: 10px 20px;
                font-size: 12px;
                font-weight: 600;
                border-radius: 6px;
            }
        """)
        btn_save.clicked.connect(self.create_activity)
        layout.addRow("", btn_save)
        self.tab_create.setLayout(layout)

    def build_list_tab(self):
        v = QVBoxLayout(self.tab_list)
        v.setSpacing(15)
        v.setContentsMargins(15, 15, 15, 15)

        # Adicionar título e botão de atualizar
        header_layout = QHBoxLayout()
        header_label = QLabel("Robôs de Automação RPA")
        header_label.setStyleSheet("""
            QLabel {
                color: #E8EAED;
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 10px;
            }
        """)
        refresh_btn = QPushButton("Atualizar")
        refresh_btn.clicked.connect(self.refresh_table)
        refresh_btn.setStyleSheet("""
            QPushButton {
                background-color: #0078d7;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 12px;
            }
            QPushButton:hover {
                background-color: #0066b4;
            }
        """)
        header_layout.addWidget(header_label)
        header_layout.addStretch()
        header_layout.addWidget(refresh_btn)
        v.addLayout(header_layout)

        # Área de scroll para os cards
        from PyQt6.QtWidgets import QScrollArea
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setStyleSheet("""
            QScrollArea {
                border: none;
                background-color: transparent;
            }
            QScrollBar:vertical {
                background: #2d2d30;
                width: 15px;
                border-radius: 4px;
            }
            QScrollBar::handle:vertical {
                background: #555555;
                border-radius: 4px;
                min-height: 20px;
            }
            QScrollBar::handle:vertical:hover {
                background: #666666;
            }
        """)

        # Widget container para os cards
        self.cards_container = QWidget()
        self.cards_layout = QVBoxLayout(self.cards_container)
        self.cards_layout.setSpacing(15)
        self.cards_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        scroll_area.setWidget(self.cards_container)
        v.addWidget(scroll_area)
        self.tab_list.setLayout(v)

    def build_logs_tab(self):
        v = QVBoxLayout(self.tab_logs)
        top = QHBoxLayout()
        btn_export = QPushButton("Exportar Logs (CSV)");
        btn_export.clicked.connect(self.export_logs_csv)
        btn_clear = QPushButton("Limpar Logs");
        btn_clear.clicked.connect(self.clear_logs)
        top.addWidget(btn_export);
        top.addWidget(btn_clear);
        top.addStretch()
        v.addLayout(top)
        self.logs_table = QTableWidget()
        self.logs_table.setColumnCount(4)
        self.logs_table.setHorizontalHeaderLabels(["Timestamp", "Atividade", "Resultado", "Mensagem"])
        self.logs_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.logs_table.verticalHeader().setVisible(False)
        self.logs_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.logs_table.setAlternatingRowColors(False)  # Remover listras alternadas
        v.addWidget(self.logs_table)
        self.tab_logs.setLayout(v)

    def apply_theme(self):
        pal = QPalette()
        pal.setColor(QPalette.ColorRole.Window, QColor("#202124"))
        pal.setColor(QPalette.ColorRole.WindowText, QColor("#E8EAED"))
        pal.setColor(QPalette.ColorRole.Base, QColor("#2B2C2E"))
        pal.setColor(QPalette.ColorRole.AlternateBase, QColor("#303134"))
        pal.setColor(QPalette.ColorRole.ToolTipBase, QColor("#E8EAED"))
        pal.setColor(QPalette.ColorRole.ToolTipText, QColor("#E8EAED"))
        pal.setColor(QPalette.ColorRole.Text, QColor("#E8EAED"))
        pal.setColor(QPalette.ColorRole.Button, QColor("#3C4043"))
        pal.setColor(QPalette.ColorRole.ButtonText, QColor("#E8EAED"))
        pal.setColor(QPalette.ColorRole.Highlight, QColor("#1A73E8"))
        pal.setColor(QPalette.ColorRole.HighlightedText, QColor("#FFFFFF"))
        self.setPalette(pal)

        self.setStyleSheet("""
            QWidget { 
                background-color: #1e1e1e; 
                color: #E8EAED; 
                font-family: 'Segoe UI', 'Arial', sans-serif;
            }
            QTabWidget::pane { 
                border: 1px solid #3C4043; 
                border-radius: 10px;
                background-color: #252526;
                padding: 5px;
            }
            QTabBar::tab { 
                background: #2d2d30; 
                padding: 12px 20px; 
                margin: 3px; 
                border-radius: 8px; 
                transition: all 0.3s ease; 
                font-weight: 600;
                border: 1px solid #3C4043;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            QTabBar::tab:selected { 
                background: #0078d7; 
                color: #FFFFFF;
                border: 1px solid #0078d7;
            }
            QTabBar::tab:hover:!selected {
                background: #3e3e42;
            }
            QTableWidget { 
                background: #303134; 
                color: #E8EAED; 
                border: 1px solid #3C4043;
                border-radius: 8px;
                gridline-color: #3C4043;
                selection-background-color: #0078d7;
                selection-color: #FFFFFF;
                alternate-background-color: #2d2d30;
            }
            QTableWidget::item:hover { 
                background: #3a3a3a; 
            }
            QHeaderView::section { 
                background: #3C4043; 
                color: #E8EAED; 
                padding: 10px 8px; 
                border: 1px solid #35383A;
                font-weight: 600;
                border-radius: 4px;
                font-size: 10px;
                text-transform: uppercase;
            }
            QPushButton { 
                background-color: #0078d7; 
                color: #FFFFFF; 
                padding: 10px 16px; 
                border-radius: 6px; 
                transition: all 0.3s ease; 
                border: none;
                font-weight: 600;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            QPushButton:hover { 
                background-color: #0066b4; 
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            }
            QPushButton:pressed {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                background-color: #005a9e;
            }
            QPushButton:disabled {
                background-color: #3c3c3c;
                color: #777777;
                transform: none;
                box-shadow: none;
            }
            QLineEdit, QComboBox, QSpinBox, QTimeEdit { 
                background-color: #303134; 
                color: #E8EAED; 
                padding: 10px; 
                border-radius: 6px;
                border: 1px solid #444;
                font-size: 10px;
            }
            QLineEdit:focus, QComboBox:focus, QSpinBox:focus, QTimeEdit:focus {
                border: 1px solid #0078d7;
                outline: none;
                box-shadow: 0 0 0 2px rgba(0, 120, 215, 0.3);
            }
            QCheckBox { 
                color: #E8EAED; 
                spacing: 8px;
                font-size: 11px;
            }
            QCheckBox::indicator {
                width: 20px;
                height: 20px;
                border-radius: 4px;
                border: 1px solid #444;
            }
            QCheckBox::indicator:unchecked {
                background-color: #303134;
            }
            QCheckBox::indicator:checked {
                background-color: #0078d7;
                border: 1px solid #0078d7;
            }
            QStatusBar {
                background-color: #252526;
                color: #E8EAED;
                border-top: 1px solid #3C4043;
                padding: 8px;
            }
            QStatusBar QLabel {
                font-weight: 500;
                font-size: 10px;
            }
        """)
        self.setFont(QFont("Segoe UI", 10))

    # -----------------------
    # Persistence
    # -----------------------
    def load_activities(self):
        try:
            if Path(DATA_FILE).exists():
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    self.activities = json.load(f)
            else:
                # sample defaults
                self.activities = [
                    {"nome": "Inspeção Linha A", "descricao": "Inspeção automática da linha A", "status": "Ativo",
                     "path": "", "duracao_min": 4, "repete_a_cada_min": 0, "time_start": "08:00", "time_stop": "08:00",
                     "weekdays": [0, 1, 2, 3, 4]},
                    {"nome": "Backup Noturno", "descricao": "Backup incremental", "status": "Ativo", "path": "",
                     "duracao_min": 10, "repete_a_cada_min": 0, "time_start": "02:00", "time_stop": "02:00",
                     "weekdays": [0, 1, 2, 3, 4, 5, 6]},
                ]
        except Exception as e:
            QMessageBox.warning(self, "Erro", f"Falha ao carregar atividades: {e}")
            self.activities = []

    def save_activities(self):
        try:
            ensure_dir_for_file(DATA_FILE)
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(self.activities, f, ensure_ascii=False, indent=2)
        except Exception as e:
            QMessageBox.warning(self, "Erro", f"Falha ao salvar atividades: {e}")

    def load_logs(self):
        try:
            if Path(LOG_FILE).exists():
                with open(LOG_FILE, "r", encoding="utf-8") as f:
                    self.logs = json.load(f)
            else:
                self.logs = []
        except Exception as e:
            QMessageBox.warning(self, "Erro", f"Falha ao carregar logs: {e}")
            self.logs = []

    def save_logs(self):
        try:
            ensure_dir_for_file(LOG_FILE)
            with open(LOG_FILE, "w", encoding="utf-8") as f:
                json.dump(self.logs, f, ensure_ascii=False, indent=2)
        except Exception as e:
            QMessageBox.warning(self, "Erro", f"Falha ao salvar logs: {e}")

    # -----------------------
    # Table refresh
    # -----------------------
    def refresh_table(self):
        # Limpar o layout de cards existente
        for i in reversed(range(self.cards_layout.count())):
            widget = self.cards_layout.itemAt(i).widget()
            if widget:
                widget.setParent(None)
                widget.deleteLater()

        # Criar cards para cada atividade
        for r, a in enumerate(self.activities):
            card = self.create_activity_card(r, a)
            self.cards_layout.addWidget(card)

        self.queue_label.setText(f"Fila: {len(self.queue)}")

    def create_activity_card(self, index: int, activity: Dict[str, Any]) -> QWidget:
        """Cria um card visual para uma atividade"""
        card = QWidget()
        card.setStyleSheet("""
            QWidget {
                background-color: #2d2d30;
                border: 1px solid #3C4043;
                border-radius: 10px;
                padding: 15px;
                margin: 5px;
            }
            QWidget:hover {
                background-color: #333337;
                border: 1px solid #0078d7;
            }
        """)

        layout = QVBoxLayout(card)
        layout.setSpacing(10)

        # Cabeçalho do card
        header_layout = QHBoxLayout()
        title = QLabel(activity.get("nome", "(sem nome)"))
        title.setStyleSheet("""
            QLabel {
                color: #E8EAED;
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 5px;
            }
        """)
        header_layout.addWidget(title)
        header_layout.addStretch()

        # Status
        status = activity.get("status", "Inativo")
        status_label = QLabel(status)
        status_label.setStyleSheet(f"""
            QLabel {{
                color: {status_color(status).name()};
                font-size: 12px;
                font-weight: 600;
                padding: 4px 8px;
                border-radius: 10px;
                background-color: rgba(46, 204, 113, 0.1);
            }}
        """)
        header_layout.addWidget(status_label)

        # Botão de expansão/recolhimento
        toggle_btn = QPushButton("▼")
        toggle_btn.setStyleSheet("""
            QPushButton {
                background-color: transparent;
                color: #AAAAAA;
                border: none;
                font-size: 14px;
                font-weight: bold;
                width: 24px;
                height: 24px;
            }
            QPushButton:hover {
                color: #E8EAED;
            }
        """)
        toggle_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        header_layout.addWidget(toggle_btn)

        layout.addLayout(header_layout)

        # Informações de horário (sempre visíveis)
        time_layout = QHBoxLayout()
        time_layout.setSpacing(15)

        start_time_label = QLabel("Início:")
        start_time_label.setStyleSheet("QLabel { color: #AAAAAA; font-size: 12px; font-weight: 500; }")
        start_time_value = QLabel(activity.get("time_start", "—"))
        start_time_value.setStyleSheet("QLabel { color: #E8EAED; font-size: 12px; font-weight: 500; }")
        time_layout.addWidget(start_time_label)
        time_layout.addWidget(start_time_value)
        time_layout.addStretch()

        next_run_label = QLabel("Próxima:")
        next_run_label.setStyleSheet("QLabel { color: #AAAAAA; font-size: 12px; font-weight: 500; }")
        next_run_value = QLabel(self.calculate_next_run_display(activity))
        next_run_value.setStyleSheet("QLabel { color: #E8EAED; font-size: 12px; font-weight: 500; }")
        time_layout.addWidget(next_run_label)
        time_layout.addWidget(next_run_value)

        layout.addLayout(time_layout)

        # Conteúdo expansível
        content = QWidget()
        content_layout = QVBoxLayout(content)
        content_layout.setSpacing(10)

        # Descrição
        desc = QLabel(activity.get("descricao", ""))
        desc.setStyleSheet("""
            QLabel {
                color: #AAAAAA;
                font-size: 12px;
                font-weight: 400;
                margin-bottom: 10px;
            }
        """)
        desc.setWordWrap(True)
        content_layout.addWidget(desc)

        # Detalhes da atividade
        details_layout = QGridLayout()
        details_layout.setSpacing(8)

        # Horário
        time_label = QLabel("Horário:")
        time_label.setStyleSheet("QLabel { color: #AAAAAA; font-size: 11px; font-weight: 500; }")
        time_value = QLabel(activity.get("time_start", "—"))
        time_value.setStyleSheet("QLabel { color: #E8EAED; font-size: 11px; font-weight: 500; }")
        details_layout.addWidget(time_label, 0, 0)
        details_layout.addWidget(time_value, 0, 1)

        # Duração
        dur_label = QLabel("Duração:")
        dur_label.setStyleSheet("QLabel { color: #AAAAAA; font-size: 11px; font-weight: 500; }")
        dur_value = QLabel(f"{activity.get('duracao_min', 0)} min")
        dur_value.setStyleSheet("QLabel { color: #E8EAED; font-size: 11px; font-weight: 500; }")
        details_layout.addWidget(dur_label, 1, 0)
        details_layout.addWidget(dur_value, 1, 1)

        # Intervalo
        interval = activity.get("repete_a_cada_min", 0) or 0
        interval_label = QLabel("Intervalo:")
        interval_label.setStyleSheet("QLabel { color: #AAAAAA; font-size: 11px; font-weight: 500; }")
        interval_value = QLabel(f"{interval} min" if interval > 0 else "—")
        interval_value.setStyleSheet("QLabel { color: #E8EAED; font-size: 11px; font-weight: 500; }")
        details_layout.addWidget(interval_label, 2, 0)
        details_layout.addWidget(interval_value, 2, 1)

        # Dias
        weekdays = activity.get("weekdays", [])
        days_map = {0: "Seg", 1: "Ter", 2: "Qua", 3: "Qui", 4: "Sex", 5: "Sáb", 6: "Dom"}
        days_text = ", ".join([days_map[d] for d in weekdays if d in days_map]) if weekdays else "Todos"
        days_label = QLabel("Dias:")
        days_label.setStyleSheet("QLabel { color: #AAAAAA; font-size: 11px; font-weight: 500; }")
        days_value = QLabel(days_text)
        days_value.setStyleSheet("QLabel { color: #E8EAED; font-size: 11px; font-weight: 500; }")
        details_layout.addWidget(days_label, 3, 0)
        details_layout.addWidget(days_value, 3, 1)

        # Próxima execução
        next_label = QLabel("Próxima Execução:")
        next_label.setStyleSheet("QLabel { color: #AAAAAA; font-size: 11px; font-weight: 500; }")
        next_value = QLabel(self.calculate_next_run_display(activity))
        next_value.setStyleSheet("QLabel { color: #E8EAED; font-size: 11px; font-weight: 500; }")
        details_layout.addWidget(next_label, 4, 0)
        details_layout.addWidget(next_value, 4, 1)

        content_layout.addLayout(details_layout)
        content_layout.addStretch()

        # Botões de ação
        actions_layout = QHBoxLayout()
        actions_layout.setSpacing(8)

        btn_run = QPushButton("▶ Executar")
        btn_run.setStyleSheet("""
            QPushButton {
                background-color: #0078d7;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 11px;
            }
            QPushButton:hover {
                background-color: #0066b4;
            }
            QPushButton:pressed {
                background-color: #005a9e;
            }
        """)
        btn_run.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_run.clicked.connect(lambda _, idx=index: self.enqueue_or_execute(self.activities[idx]))
        actions_layout.addWidget(btn_run)

        btn_edit = QPushButton("✏️ Editar")
        btn_edit.setStyleSheet("""
            QPushButton {
                background-color: #3C4043;
                color: #E8EAED;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 11px;
            }
            QPushButton:hover {
                background-color: #4a4a4f;
            }
            QPushButton:pressed {
                background-color: #333337;
            }
        """)
        btn_edit.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_edit.clicked.connect(lambda _, idx=index: self.open_activity_popup(idx))
        actions_layout.addWidget(btn_edit)

        # Botão para pausar/desativar atividade
        btn_pause = QPushButton("⏸ Pausar" if activity.get("status", "").lower() == "ativo" else "▶ Ativar")
        btn_pause.setStyleSheet("""
            QPushButton {
                background-color: #f39c12;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 11px;
            }
            QPushButton:hover {
                background-color: #e67e22;
            }
            QPushButton:pressed {
                background-color: #d35400;
            }
        """)
        btn_pause.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_pause.clicked.connect(lambda _, idx=index: self.toggle_activity_status(idx))
        actions_layout.addWidget(btn_pause)

        btn_del = QPushButton("✕ Remover")
        btn_del.setStyleSheet("""
            QPushButton {
                background-color: #c23838;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 11px;
            }
            QPushButton:hover {
                background-color: #a72d2d;
            }
            QPushButton:pressed {
                background-color: #8b2525;
            }
        """)
        btn_del.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_del.clicked.connect(lambda _, idx=index: self.remove_activity(idx))
        actions_layout.addWidget(btn_del)

        content_layout.addLayout(actions_layout)
        layout.addWidget(content)

        # Estado de expansão
        content.setVisible(False)  # Inicialmente recolhido

        # Conectar o botão de toggle
        def toggle_content():
            is_visible = content.isVisible()
            content.setVisible(not is_visible)
            toggle_btn.setText("▲" if not is_visible else "▼")

        toggle_btn.clicked.connect(toggle_content)

        return card

    def refresh_logs_table(self):
        self.logs_table.setRowCount(len(self.logs))
        for r, lg in enumerate(self.logs):
            it_time = QTableWidgetItem(lg.get("timestamp", ""))
            it_name = QTableWidgetItem(lg.get("nome", ""))
            it_result = QTableWidgetItem(lg.get("result", ""))
            it_msg = QTableWidgetItem(lg.get("message", ""))
            for it in (it_time, it_name, it_result, it_msg): center_item(it)
            # color
            if lg.get("result") == "success":
                it_result.setForeground(QColor("#2ECC71"))
            elif lg.get("result") == "blocked":
                it_result.setForeground(QColor("#F1C40F"))
            elif lg.get("result") == "simulated":
                it_result.setForeground(QColor("#3498DB"))
            elif lg.get("result") == "queued" or lg.get("result") == "queued_by_scheduler" or lg.get(
                    "result") == "queued_manual":
                it_result.setForeground(QColor("#9B59B6"))
            else:
                it_result.setForeground(QColor("#E74C3C"))
            self.logs_table.setItem(r, 0, it_time);
            self.logs_table.setItem(r, 1, it_name)
            self.logs_table.setItem(r, 2, it_result);
            self.logs_table.setItem(r, 3, it_msg)
        self.logs_table.resizeRowsToContents()

    # -----------------------
    # Actions: create / edit / remove / import
    # -----------------------
    def browse_file_create(self):
        path, _ = QFileDialog.getSaveFileName(self, "Selecionar arquivo", "", "Todos os arquivos (*.*)")
        if path:
            self.in_path.setText(path)

    def create_activity(self):
        name = self.in_name.text().strip()
        if not name:
            QMessageBox.warning(self, "Aviso", "Nome obrigatório.")
            return
        # prevent trivial duplicate names
        if any(a.get("nome", "").strip().lower() == name.lower() for a in self.activities):
            if QMessageBox.question(self, "Duplicado",
                                    f"Já existe atividade com nome '{name}'. Criar mesmo assim?") != QMessageBox.StandardButton.Yes:
                return
        act = {
            "nome": name,
            "descricao": self.in_desc.text().strip(),
            "path": self.in_path.text().strip(),
            "status": self.in_status.currentText(),
            "duracao_min": int(self.in_duration.value()),
            "repete_a_cada_min": int(self.in_every.value()),
            "time_start": self.in_time_start.time().toString("HH:mm"),
            "time_stop": self.in_time_stop.time().toString("HH:mm"),
            "weekdays": [i for i, c in
                         enumerate((self.c_mon, self.c_tue, self.c_wed, self.c_thu, self.c_fri, self.c_sat, self.c_sun))
                         if c.isChecked()],
        }
        self.activities.append(act)
        self.save_activities()
        self.refresh_table()
        QMessageBox.information(self, "Criado", f"Atividade '{name}' criada.")
        # clear form
        self.in_name.clear();
        self.in_desc.clear();
        self.in_path.clear();
        self.in_status.setCurrentIndex(0)
        self.in_duration.setValue(5);
        self.in_every.setValue(0)
        for c in (self.c_mon, self.c_tue, self.c_wed, self.c_thu, self.c_fri, self.c_sat, self.c_sun): c.setChecked(
            False)


    def open_activity_popup(self, row: int):
        if not (0 <= row < len(self.activities)): return
        dlg = EditActivityPopup(self, self.activities[row])
        dlg.exec()
        self.save_activities()
        self.refresh_table()

    def remove_activity(self, index: int):
        if not (0 <= index < len(self.activities)): return
        a = self.activities[index]
        if QMessageBox.question(self, "Confirmar", f"Remover '{a.get('nome')}'?") != QMessageBox.StandardButton.Yes:
            return
        del self.activities[index]
        self.save_activities()
        self.refresh_table()

    # -----------------------
    # Execution / Queue / Busy (agora threaded)
    # -----------------------

    def on_notifications_changed(self, state):
        self.enable_notifications = bool(state == Qt.CheckState.Checked)

    def is_globally_busy(self) -> bool:
        if not self.busy_until: return False
        return datetime.now() < self.busy_until

    def start_global_busy(self, minutes: int):
        self.busy_until = datetime.now() + timedelta(minutes=minutes)
        self.update_status_bar()

    def enqueue_or_execute(self, activity: Dict[str, Any]):
        # Verificar se a atividade já está em execução
        if activity.get("_executing"):
            entry = {"timestamp": now_iso(), "nome": activity.get("nome", ""), "result": "blocked",
                     "message": "Atividade já está em execução."}
            self.logs.insert(0, entry);
            self.save_logs();
            self.refresh_logs_table()
            if self.enable_notifications:
                QMessageBox.warning(self, "Bloqueado", f"Atividade '{activity.get('nome')}' já está em execução.")
            return

        if self.is_globally_busy():
            self.queue.append(activity)
            self.queue_label.setText(f"Fila: {len(self.queue)}")
            entry = {"timestamp": now_iso(), "nome": activity.get("nome", ""), "result": "queued",
                     "message": "Colocado em fila por busy_until."}
            self.logs.insert(0, entry);
            self.save_logs();
            self.refresh_logs_table()
            if self.enable_notifications:
                QMessageBox.information(self, "Enfileirado",
                                        f"'{activity.get('nome')}' entrou na fila. Posição: {len(self.queue)}")
            return

        if self.queue_paused:
            self.queue.append(activity)
            entry = {"timestamp": now_iso(), "nome": activity.get("nome", ""), "result": "queued_manual",
                     "message": "Fila pausada — enfileirado manualmente."}
            self.logs.insert(0, entry);
            self.save_logs();
            self.refresh_logs_table()
            if self.enable_notifications:
                QMessageBox.information(self, "Pausado", f"Fila pausada — '{activity.get('nome')}' foi enfileirado.")
            return

        # Open ActivityPopup modeless (so UI stays responsive)
        popup = ActivityPopup(self, activity, auto_close_ms=3000)
        popup.show()  # non-blocking; popup will call execute when timer finishes or on run-now

    def execute_activity_now(self, activity: Dict[str, Any]):
        """
        Start activity in ExecutionThread. This function returns immediately.
        The finished handler will process logs and busy state.
        """
        # guard against double-start for same activity object
        if activity.get("_executing"):
            return
        activity["_executing"] = True

        name = activity.get("nome", "(sem nome)")
        dur = int(activity.get("duracao_min", 1) or 1)

        # start the execution in a thread
        thread = ExecutionThread(activity)
        thread.finished_signal.connect(self._on_thread_finished)
        # keep reference to prevent GC
        self._active_threads.append(thread)
        # log started
        entry = {"timestamp": now_iso(), "nome": name, "path": activity.get("path", ""), "result": "started",
                 "message": f"Iniciado em {now_iso()}"}
        self.logs.insert(0, entry);
        self.save_logs();
        self.refresh_logs_table()
        thread.start()

    def _on_thread_finished(self, activity_obj, result, message, dur_minutes):
        # activity_obj may be the same dict reference
        # persist log
        entry = {"timestamp": now_iso(), "nome": activity_obj.get("nome", ""), "path": activity_obj.get("path", ""),
                 "result": result, "message": message}
        self.logs.insert(0, entry)
        self.save_logs()
        self.refresh_logs_table()

        # mark not executing
        try:
            activity_obj["_executing"] = False
        except Exception:
            pass

        # start busy window if success
        if result == "success":
            self.start_global_busy(dur_minutes)
            # Show notification if enabled
            if self.enable_notifications:
                QMessageBox.information(self, "Execução Concluída",
                                        f"Atividade '{activity_obj.get('nome')}' executada com sucesso!")
        elif result == "fail":
            # Show failure notification if enabled
            if self.enable_notifications:
                QMessageBox.critical(self, "Execução Falhou",
                                     f"Falha ao executar atividade '{activity_obj.get('nome')}': {message}")

        # cleanup finished thread references
        # remove threads that are finished (safe since this handler called from that thread)
        alive = []
        for t in self._active_threads:
            if t.isRunning():
                alive.append(t)
        self._active_threads = alive

        # if we are free and queue has items -> schedule next (respect pause)
        if not self.is_globally_busy() and not self.queue_paused and self.queue:
            # pop left and start next (will open popup)
            next_act = self.queue.popleft()
            entry = {"timestamp": now_iso(), "nome": next_act.get("nome", ""), "result": "dequeued",
                     "message": "Removido da fila para execução."}
            self.logs.insert(0, entry);
            self.save_logs();
            self.refresh_logs_table()
            # small delay to let UI update
            QTimer.singleShot(200, lambda: self.enqueue_or_execute(next_act))

        self.update_status_bar()
        self.refresh_table()

    def dequeue_and_maybe_execute(self):
        if not self.queue:
            return
        next_act = self.queue.popleft()
        self.queue_label.setText(f"Fila: {len(self.queue)}")
        entry = {"timestamp": now_iso(), "nome": next_act.get("nome", ""), "result": "dequeued",
                 "message": "Removido da fila para execução."}
        self.logs.insert(0, entry);
        self.save_logs();
        self.refresh_logs_table()
        if self.enable_notifications:
            QMessageBox.information(self, "Execução em Fila",
                                    f"Atividade '{next_act.get('nome')}' removida da fila para execução.")
        popup = ActivityPopup(self, next_act, auto_close_ms=2000)
        popup.show()

    # -----------------------
    # Scheduler motor
    # -----------------------
    def check_schedules_tick(self):
        now = datetime.now()
        executed_count = 0  # Limita o número de atividades executadas por tick
        max_executions_per_tick = 5  # Limite para evitar sobrecarga

        for act in self.activities:
            # Verifica se a atividade está ativa (não pausada e não inativa)
            if act.get("status", "").lower() != "ativo":
                continue
            sd = act.get("start_date")
            if sd:
                try:
                    if date.today() < date.fromisoformat(sd):
                        continue
                except Exception:
                    pass
            weekdays = act.get("weekdays", [])
            if weekdays and (now.weekday() not in weekdays):
                continue
            t_start = parse_time_str(act.get("time_start", ""))
            if not t_start:
                continue
            every = int(act.get("repete_a_cada_min", 0) or 0)
            t_stop = parse_time_str(act.get("time_stop", "")) if act.get("time_stop") else None
            now_t = now.time().replace(second=0, microsecond=0)
            in_window = False
            if every > 0 and t_stop:
                if t_stop > t_start:
                    in_window = (now_t >= t_start) and (now_t < t_stop)
                else:
                    in_window = (now_t >= t_start) or (now_t < t_stop)
            else:
                in_window = (now_t >= t_start) if every > 0 else (now_t == t_start)
            if not in_window: continue
            if every > 0:
                mins_since = minutes_since_reference(now_t, t_start)
                if mins_since % every != 0: continue
            else:
                if now_t != t_start: continue
            # ready: enqueue or execute respecting parallel/busy/pause
            if self.is_globally_busy() or self.queue_paused:
                self.queue.append(act)
                entry = {"timestamp": now_iso(), "nome": act.get("nome", ""), "result": "queued_by_scheduler",
                         "message": "Agendado e enfileirado (busy/pause)."}
                self.logs.insert(0, entry);
                self.save_logs();
                self.refresh_logs_table()
            else:
                # Verifica se já executamos o máximo de atividades neste tick
                if executed_count >= max_executions_per_tick:
                    # Coloca a atividade na fila para execução no próximo tick
                    self.queue.appendleft(act)  # Adiciona no início da fila
                    entry = {"timestamp": now_iso(), "nome": act.get("nome", ""), "result": "queued_by_scheduler",
                             "message": "Agendado e enfileirado (limite de execuções por tick)."}
                    self.logs.insert(0, entry);
                    self.save_logs();
                    self.refresh_logs_table()
                    continue

                popup = ActivityPopup(self, act, auto_close_ms=2000)
                popup.show()
                executed_count += 1
        self.refresh_table()

    # -----------------------
    # Next-run calculation
    # -----------------------
    def calculate_next_run_display(self, s: Dict[str, Any]) -> str:
        # Verifica se a atividade está ativa (não pausada e não inativa)
        if s.get("status", "").lower() != "ativo": return "—"
        now = datetime.now()
        weekdays = s.get("weekdays", [])
        if not weekdays: return "—"
        t_start = parse_time_str(s.get("time_start", ""))
        if not t_start: return "—"
        every = int(s.get("repete_a_cada_min", 0) or 0)
        t_stop = parse_time_str(s.get("time_stop", "")) if s.get("time_stop") else None
        for delta in range(0, 8):
            wd = (now.weekday() + delta) % 7
            if wd not in weekdays: continue
            candidate_date = now.date() + timedelta(days=delta)
            if delta == 0:
                if every > 0:
                    slots = self.generate_slots_for_day(t_start, t_stop, every)
                    now_t = now.time().replace(second=0, microsecond=0)
                    for ts in slots:
                        if ts >= now_t:
                            return f"{candidate_date.strftime('%d/%m/%Y')} {ts.strftime('%H:%M')}"
                    continue
                else:
                    if now.time().replace(second=0, microsecond=0) <= t_start:
                        return f"{candidate_date.strftime('%d/%m/%Y')} {t_start.strftime('%H:%M')}"
                    else:
                        continue
            else:
                if every > 0:
                    slots = self.generate_slots_for_day(t_start, t_stop, every)
                    return f"{candidate_date.strftime('%d/%m/%Y')} {slots[0].strftime('%H:%M')}"
                else:
                    return f"{candidate_date.strftime('%d/%m/%Y')} {t_start.strftime('%H:%M')}"
        return "—"

    def generate_slots_for_day(self, t_start: time, t_stop: Optional[time], every: int) -> List[time]:
        if every <= 0: return [t_start]
        slots = []
        cur = datetime.combine(date.today(), t_start)
        for i in range(24 * 60 // max(1, every) + 2):
            tt = (cur + timedelta(minutes=every * i)).time().replace(second=0, microsecond=0)
            if t_stop:
                if t_stop > t_start:
                    if not (t_start <= tt < t_stop):
                        if tt >= t_stop: break
                        continue
                else:
                    if not (tt >= t_start or tt < t_stop):
                        continue
            slots.append(tt)
            if len(slots) > 2000: break
        if not slots: slots = [t_start]
        return slots

    # -----------------------
    # Status bar / Queue handling
    # -----------------------
    def update_status_bar(self):
        if self.is_globally_busy():
            remaining = self.busy_until - datetime.now()
            total_seconds = int(remaining.total_seconds())
            if total_seconds < 0:
                self.busy_until = None
                if self.queue and not self.queue_paused:
                    QTimer.singleShot(500, self.dequeue_and_maybe_execute)
                self.busy_label.setText("Disponível ✅")
                self.queue_label.setText(f"Fila: {len(self.queue)}")
                self.update_status_bar()
                return
            mins, secs = divmod(total_seconds, 60)
            hours, mins = divmod(mins, 60)
            timestr = f"{hours:02d}:{mins:02d}:{secs:02d}"
            self.busy_label.setText(f"Executando — desbloqueia em {timestr}")
            self.busy_label.setStyleSheet("color: orange; font-weight: bold;")
        else:
            self.busy_label.setText("Disponível ✅")
            self.busy_label.setStyleSheet("color: #2ECC71; font-weight: bold;")
            if self.queue and not self.queue_paused:
                QTimer.singleShot(200, self.dequeue_and_maybe_execute)
        self.queue_label.setText(f"Fila: {len(self.queue)}")

    def toggle_pause_queue(self):
        self.queue_paused = not self.queue_paused
        if self.queue_paused:
            self.btn_pause_queue.setText("Fila Pausada")
            self.btn_pause_queue.setChecked(True)
        else:
            self.btn_pause_queue.setText("Pausar Fila")
            self.btn_pause_queue.setChecked(False)
            # if resumed and queue has jobs, start them (respecting parallel limit)
            if self.queue:
                QTimer.singleShot(200, lambda: self.enqueue_or_execute(self.queue.popleft()))

    def cycle_parallel_limit(self):
        # cycles between 1,2,4,8,0(unlimited)
        opts = [1, 2, 4, 8, 0]
        cur_idx = opts.index(self.max_parallel_runs) if self.max_parallel_runs in opts else 0
        cur_idx = (cur_idx + 1) % len(opts)
        self.max_parallel_runs = opts[cur_idx]
        self.btn_parallel.setText(f"Paralelo: {self.max_parallel_runs if self.max_parallel_runs > 0 else '∞'}")

    # -----------------------
    # Logs: export / clear
    # -----------------------
    def export_logs_csv(self):
        path, _ = QFileDialog.getSaveFileName(self, "Salvar Logs (CSV)", "logs.csv", "CSV (*.csv)")
        if not path: return
        try:
            with open(path, "w", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                w.writerow(["timestamp", "nome", "result", "message"])
                for lg in self.logs:
                    w.writerow(
                        [lg.get("timestamp", ""), lg.get("nome", ""), lg.get("result", ""), lg.get("message", "")])
            QMessageBox.information(self, "Exportado", f"Logs exportados para:\n{path}")
        except Exception as e:
            QMessageBox.warning(self, "Erro", f"Falha ao exportar logs: {e}")

    def clear_logs(self):
        if QMessageBox.question(self, "Confirmar", "Deseja limpar todos os logs?") != QMessageBox.StandardButton.Yes:
            return
        self.logs = []
        self.save_logs()
        self.refresh_logs_table()

    # -----------------------
    # Activities CSV export
    # -----------------------
    def export_activities_csv(self):
        path, _ = QFileDialog.getSaveFileName(self, "Exportar Atividades (CSV)", "atividades.csv", "CSV (*.csv)")
        if not path: return
        try:
            with open(path, "w", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                w.writerow(["nome", "descricao", "path", "status", "time_start", "time_stop", "repete_a_cada_min",
                            "duracao_min", "weekdays"])
                for a in self.activities:
                    w.writerow([a.get("nome", ""), a.get("descricao", ""), a.get("path", ""), a.get("status", ""),
                                a.get("time_start", ""), a.get("time_stop", ""), a.get("repete_a_cada_min", 0),
                                a.get("duracao_min", 0), ",".join(map(str, a.get("weekdays", [])))])
            QMessageBox.information(self, "Exportado", f"Atividades exportadas para:\n{path}")
        except Exception as e:
            QMessageBox.warning(self, "Erro", f"Falha ao exportar atividades: {e}")

    # -----------------------
    # Misc helpers
    # -----------------------
    def update_and_persist(self):
        self.save_activities()
        self.refresh_table()

    def open_detailed_popup(self):
        dlg = DetailedPopup(self)
        dlg.exec()
        self.refresh_table()

    def on_table_double(self, row, col):
        self.open_activity_popup(row)

    # -----------------------
    # Additional features
    # -----------------------
    def toggle_activity_status(self, index: int):
        if not (0 <= index < len(self.activities)): return
        activity = self.activities[index]
        current_status = activity.get("status", "").lower()
        
        # Alternar entre "Ativo" e "Pausado"
        if current_status == "ativo":
            activity["status"] = "Pausado"
        else:
            activity["status"] = "Ativo"
        
        self.save_activities()
        self.refresh_table()



# -----------------------
# Entrypoint
# -----------------------
def main():
    app = QApplication(sys.argv)
    pal = QPalette()
    pal.setColor(QPalette.ColorRole.Window, QColor("#202124"))
    pal.setColor(QPalette.ColorRole.WindowText, QColor("#E8EAED"))
    app.setPalette(pal)
    app.setFont(QFont("Segoe UI", 10))
    w = RPA_TaskManager()
    w.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
