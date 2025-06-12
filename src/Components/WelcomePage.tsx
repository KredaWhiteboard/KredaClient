import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";

function WelcomePage() {
  const [login, setLogin] = useState("");
  const navigate = useNavigate();
  const {setUsername} = useUser();

  const Submited = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (login.trim() !== "") {
      setUsername(login.trim());
      navigate("/Whiteboard");
    } else {
      alert("Proszę podać login.");
    }
  };
  return (
    <div id="container">
      <div className="box">
        <figure>
          <img src="public/logo_1.svg" alt="" />
          <figcaption>Kreda</figcaption>
        </figure>
        <form onSubmit={Submited}>
          <input
            type="text"
            id="login"
            placeholder="Wprowadź login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
          <div className="color-select">
            <div id="cl1"></div>
            <div id="cl2"></div>
            <div id="cl3"></div>
            <div id="cl4"></div>
            <div id="cl5"></div>
            <div id="cl6"></div>
          </div>
          <button type="submit">Potwierdź</button>
        </form>
      </div>
    </div>
  );
}

export default WelcomePage;
