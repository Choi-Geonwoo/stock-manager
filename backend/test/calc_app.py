import tkinter as tk
from tkinter import ttk

class CalcApp:
    def __init__(self, root):
        self.root = root
        self.root.title("행 추가 사칙연산 프로그램")
        self.root.geometry("650x400")
        
        # 메인 프레임 (스크롤 적용을 위해 구성)
        self.main_frame = ttk.Frame(self.root, padding=10)
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 상단 제어부 ([행 추가] 버튼)
        self.top_frame = ttk.Frame(self.main_frame)
        self.top_frame.pack(fill=tk.X, pady=5)
        
        self.add_btn = ttk.Button(self.top_frame, text="➕ 행 추가", command=self.add_row)
        self.add_btn.pack(side=tk.LEFT)
        
        # 행들이 들어갈 컨테이너 프레임
        self.rows_frame = ttk.Frame(self.main_frame)
        self.rows_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # 행 데이터를 저장할 리스트
        self.rows = []
        
        # 처음에 기본으로 1개 행 추가
        self.add_row()

    def add_row(self):
        # 하나의 행을 감쌀 프레임
        row_frame = ttk.Frame(self.rows_frame)
        row_frame.pack(fill=tk.X, pady=5)
        
        # 구성 요소 생성
        entry1 = ttk.Entry(row_frame, width=10)
        
        # 연산자 선택 드롭다운 ( +, -, *, / )
        operator_combo = ttk.Combobox(row_frame, values=["+", "-", "*", "/"], width=3, state="readonly")
        operator_combo.set("+") # 기본값
        
        entry2 = ttk.Entry(row_frame, width=10)
        
        equal_label = ttk.Label(row_frame, text="=")
        
        # 결과 표시 라벨 (읽기 전용 Entry처럼 보이게 하거나 Label 사용)
        result_label = ttk.Label(row_frame, text="0", font=("Arial", 10, "bold"), foreground="blue", width=15, anchor="w")
        
        # 삭제 버튼 (행이 너무 많아질 때를 대비)
        delete_btn = ttk.Button(row_frame, text="❌", width=3, 
                                command=lambda: self.delete_row(row_frame, row_data))
        
        # 정렬 배치
        entry1.pack(side=tk.LEFT, padx=5)
        operator_combo.pack(side=tk.LEFT, padx=5)
        entry2.pack(side=tk.LEFT, padx=5)
        equal_label.pack(side=tk.LEFT, padx=5)
        result_label.pack(side=tk.LEFT, padx=5)
        delete_btn.pack(side=tk.LEFT, padx=5)
        
        # 실시간 계산을 위한 이벤트 바인딩 (키를 입력할 때마다 계산)
        row_data = {
            "frame": row_frame,
            "num1": entry1,
            "op": operator_combo,
            "num2": entry2,
            "result": result_label
        }
        
        entry1.bind("<KeyRelease>", lambda event: self.calculate(row_data))
        entry2.bind("<KeyRelease>", lambda event: self.calculate(row_data))
        operator_combo.bind("<<ComboboxSelected>>", lambda event: self.calculate(row_data))
        
        self.rows.append(row_data)

    def delete_row(self, frame, row_data):
        # 화면에서 제거
        frame.destroy()
        # 리스트에서 제거
        self.rows.remove(row_data)

    def calculate(self, row):
        try:
            # 입력값 가져오기 (비어있으면 계산 안 함)
            val1_str = row["num1"].get().strip()
            val2_str = row["num2"].get().strip()
            
            if not val1_str or not val2_str:
                row["result"].config(text="입력 대기", foreground="gray")
                return
                
            val1 = float(val1_str)
            val2 = float(val2_str)
            op = row["op"].get()
            
            # 연산 수행
            if op == "+":
                res = val1 + val2
            elif op == "-":
                res = val1 - val2
            elif op == "*":
                res = val1 * val2
            elif op == "/":
                if val2 == 0:
                    row["result"].config(text="0으로 나눌 수 없음", foreground="red")
                    return
                res = val1 / val2
            
            # 소수점 뒤가 0이면 정수로 변환 (예: 5.0 -> 5)
            if res.is_integer():
                res = int(res)
            else:
                res = round(res, 4) # 소수점 4자리까지 제한
                
            row["result"].config(text=str(res), foreground="blue")
            
        except ValueError:
            row["result"].config(text="숫자만 입력", foreground="red")

# 프로그램 시작
if __name__ == "__main__":
    root = tk.Tk()
    app = CalcApp(root)
    root.mainloop()