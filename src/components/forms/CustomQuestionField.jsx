export default function CustomQuestionField({ question, value, onChange }) {
    const common = { id: question.id, required: question.required, value: value ?? "", onChange: (event) => onChange(event.target.value) };
    if (question.type === "textarea")
        return <textarea {...common} rows="4"/>;
    if (question.type === "select") {
        return (<select {...common}>
        <option value="">Select an option</option>
        {(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>);
    }
    if (question.type === "radio") {
        return (<div className="choice-list">
        {(question.options || []).map((option) => (<label key={option} className="choice-item">
            <input type="radio" name={question.id} checked={value === option} onChange={() => onChange(option)} required={question.required}/>
            <span>{option}</span>
          </label>))}
      </div>);
    }
    if (question.type === "checkbox") {
        const selected = Array.isArray(value) ? value : [];
        return (<div className="choice-list">
        {(question.options || []).map((option) => (<label key={option} className="choice-item">
            <input type="checkbox" checked={selected.includes(option)} onChange={(event) => onChange(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))}/>
            <span>{option}</span>
          </label>))}
      </div>);
    }
    const typeMap = { number: "number", date: "date", email: "email", phone: "tel" };
    return <input type={typeMap[question.type] || "text"} {...common}/>;
}

