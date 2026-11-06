import Icon from './Icon.jsx';

export default function Logo({ size = 'md', light = false }) {
  return (
    <div className={`logo logo--${size} ${light ? 'logo--light' : ''}`.trim()}>
      <span className="logo__mark">
        <Icon name="tooth" size={size === 'lg' ? 28 : 20} />
      </span>
      <span className="logo__text">Odonty</span>
    </div>
  );
}
