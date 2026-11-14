Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""M:\BOG_AMA\projects\estimate-cad-app\scripts\start_app.ps1""", 0, False
