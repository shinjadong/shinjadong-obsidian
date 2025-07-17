// Templater User Script: rollover_daily_todos_uncompleted.js
// Scripts 폴더에 저장

module.exports = async (tp) => {
    const dv = app.plugins.plugins.dataview.api;
    const currentFile = tp.file.title;
    const currentDate = moment(currentFile);
    
    // 최근 30일간의 미완료 작업만 가져오기
    const pages = dv.pages('"DailyNotes"')
        .where(p => {
            const pageDate = moment(p.file.name);
            return pageDate.isValid() && 
                   pageDate.isBefore(currentDate) && 
                   pageDate.isAfter(currentDate.clone().subtract(30, 'days'));
        })
        .sort(p => p.file.name, 'desc');
    
    let output = "";
    let tasksByProject = {};
    
    for (const page of pages) {
        const content = await app.vault.read(page.file);
        const tasks = content.match(/- \[ \] .+/g) || [];
        
        for (const task of tasks) {
            // 프로젝트 태그 찾기 (예: [[프로젝트명]])
            const projectMatch = task.match(/\[\[([^\]]+)\]\]/);
            const projectName = projectMatch ? projectMatch[1] : "기타";
            
            if (!tasksByProject[projectName]) {
                tasksByProject[projectName] = [];
            }
            
            // 중복 제거 및 날짜 추가
            const taskWithDate = task + ` (from [[${page.file.name}]])`;
            if (!tasksByProject[projectName].some(t => t.includes(task))) {
                tasksByProject[projectName].push(taskWithDate);
            }
        }
    }
    
    // 프로젝트별로 정리해서 출력
    if (Object.keys(tasksByProject).length > 0) {
        output += "### 🔄 이월된 작업\n";
        for (const [project, tasks] of Object.entries(tasksByProject)) {
            if (project !== "기타") {
                output += `#### [[${project}]]\n`;
            }
            for (const task of tasks.slice(0, 5)) { // 최대 5개만 표시
                output += task + "\n";
            }
        }
    }
    
    return output;
};
