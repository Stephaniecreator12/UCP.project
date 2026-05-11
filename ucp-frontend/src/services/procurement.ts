const project_code = [
  "MDG-S-MOH-4041",
  "MGD-HSS-3",
  "MGD-FAE",
  "MGD-COVID19-CDS",
  "MGD-VAR",
  "P175110",
  "PAD4924",
  "P174903"
]
const projectCodeGenerator = (value:string) =>{
  let code = "";
    if(value == "SRPS" || value == "CS7"){
      code = project_code[0];
    }else if(value == "RSS3"){
      code = project_code[1]
    }else if(value == "FAE"){
      code = project_code[2]
    }else if(value == "CDS"){
      code = project_code[3]
    }else if(value == "VAR"){
      code = project_code[4]
    }else if(value == "PARN2"){
      const chance: number = Math.random() < 0.5 ? 0 : 1;
      if(chance == 0){
        code = project_code[5]
      }else{
        code = project_code[6]
      }
    }
    else{
      code = project_code[project_code.length-1];
    }
  const result = code;
  return result;
}