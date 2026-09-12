function createCommandTable() {
  const tableContainer = select("#command-table-container");
  if (tableContainer) {
    tableContainer.html("");
    const table = createElement("table");
    tableContainer.child(table);
    updateCommandTable();
  }
}

function updateCommandTable() {
  const table = select("table");
  if (table) {
    table.html("");
    const header = createElement("tr");
    header.child(createElement("th", "음성 명령")).child(createElement("th", "데이터")).child(createElement("th", "삭제"));
    table.child(header);

    Object.entries(voiceCommands).forEach(([command, phrases]) => {
      const row = createElement("tr");
      row.child(createElement("td", phrases.join(", "))).child(createElement("td", command)).child(createElement("td", ""));
      table.child(row);
    });

    Object.entries(userCommands).forEach(([command, data]) => {
      const row = createElement("tr");
      row.child(textCell(command)).child(textCell(data[0]));
      
      const deleteBtn = createButton("X").style("color", "#EA4335").style("border", "none").style("background", "transparent").style("cursor", "pointer");
      deleteBtn.mousePressed(() => { delete userCommands[command]; updateCommandTable(); });
      row.child(createElement("td").child(deleteBtn)).style("background-color", "#F1F8E9");
      table.child(row);
    });
  }
}

function createUserCommandUI() {
  const inputContainer = select("#user-command-ui");
  if (inputContainer) {
    const commandInput = createInput().attribute("placeholder", "새 명령어");
    const dataInput = createInput().attribute("placeholder", "영어 데이터");
    
    const addButton = createButton("추가").addClass("start-button");
    addButton.mousePressed(() => {
      const cmd = commandInput.value().trim();
      const data = dataInput.value().trim();
      if (!cmd || !data) return alert("모두 입력해주세요.");
      if (!validData(data)) return alert("전송 데이터는 줄바꿈 없이 영문·숫자·기호로 입력해주세요.");
      userCommands[cmd] = [data];
      updateCommandTable();
      commandInput.value(""); dataInput.value("");
    });
    
    inputContainer.child(commandInput).child(dataInput).child(addButton);
    
    const exportBtn = createButton("엑셀 내보내기").addClass("excel-button");
    exportBtn.mousePressed(exportCommandsToExcel);
    const importBtn = createButton("엑셀 불러오기").addClass("excel-button");
    importBtn.mousePressed(() => select("#excelInput").elt.click());
    
    inputContainer.child(exportBtn).child(importBtn);
  }
}

function exportCommandsToExcel() {
  if (Object.keys(userCommands).length === 0) return alert("명령어가 없습니다.");
  const wsData = [["Command", "Data"]];
  Object.entries(userCommands).forEach(([key, val]) => wsData.push([key, val[0]]));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "UserCommands");
  XLSX.writeFile(wb, "commands_backup.xlsx");
}

function importCommandsFromExcel(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const workbook = XLSX.read(new Uint8Array(e.target.result), {type:'array'});
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header:1});
      let count=0, skipped=0;
      for(const row of rows.slice(1)) {
        const command=String(row[0]??'').trim(), data=String(row[1]??'').trim();
        if(!command || !validData(data)){skipped++;continue;}
        userCommands[command]=[data];count++;
      }
      updateCommandTable();alert(count+'개 불러옴'+(skipped?' · '+skipped+'개 제외':''));
    } catch(error){alert('엑셀 파일을 읽을 수 없습니다. Command / Data 열을 확인하세요.');}
    finally{select('#excelInput').value('');}
  };
  reader.onerror=()=>{alert('파일을 읽을 수 없습니다.');select('#excelInput').value('');};
  reader.readAsArrayBuffer(file);
}

