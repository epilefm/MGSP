export default function Links({categories}) {
    return (
        <div className="mgsp-links">
            {categories.map(cat => (
                <div className="mgsp-links-group" key={cat.name}>
                    <div className="mgsp-links-list">
                        {cat.links.map(link => (
                            <a key={link.name} href={link.path} className={link.locked ? 'locked' : ''}>
                                <span className="icon">
                                    {link.icon && <img src={link.icon} style={link.locked ? {opacity: 0.5, filter: 'blur(1px)'} : {}}/>}
                                </span>
                                <span className="title">{link.name}</span>
                            </a>
                        ))}
                    </div>
                    <div className="mgsp-links-category">{cat.name}</div>
                </div>
            ))}
        </div>
    )
}
