import { SHORTCUTS } from '../shortcuts.js';

export default function ShortcutList() {
  return (
    <table className="shortcut-table">
      <tbody>
        {SHORTCUTS.map((s) => (
          <tr key={s.desc + s.keys.join()}>
            <td>{s.keys.map((k) => <kbd key={k}>{k}</kbd>)}</td>
            <td>{s.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
